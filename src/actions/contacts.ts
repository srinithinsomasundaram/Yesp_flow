"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId, hasPermission } from "@/lib/auth-helper";
import type { ContactRow, ContactTabCounts } from "@/types/db";
import { CONTACTS_PAGE_SIZE, CONTACT_IMPORT_BATCH_SIZE, MAX_CONTACTS } from "@/lib/pagination";

// Lightweight count-only query — no full field fetch, just IDs + CCS status fields.
// Used by the contacts page tab bar so counts stay accurate across all pages.
export async function getContactTabCounts(): Promise<ContactTabCounts> {
  const userId = await getCurrentUserId();
  const rows: Array<{ id: string; states: Array<{ status: string; nextActionDate: string | null }> }> = [];
  // PostgREST caps a single response at 1,000 rows by default.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("Contact")
      .select("id, states:ContactCampaignState(status, nextActionDate)")
      .eq("userId", userId)
      .order("id")
      .range(offset, offset + 499);
    if (error) { dbLog("getContactTabCounts", error); break; }
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    all: rows.length,
    unsent: rows.filter((r) =>
      (r.states as Array<{ status: string }>).some((s) => s.status === "New")
    ).length,
    today: rows.filter((r) =>
      (r.states as Array<{ status: string; nextActionDate: string | null }>).some(
        (s) =>
          (s.status === "Waiting" || s.status === "Contacted") &&
          s.nextActionDate &&
          new Date(s.nextActionDate) <= today
      )
    ).length,
    replied: rows.filter((r) =>
      (r.states as Array<{ status: string }>).some((s) => s.status === "Replied")
    ).length,
    completed: rows.filter((r) =>
      (r.states as Array<{ status: string }>).some((s) => s.status === "Completed")
    ).length,
    bounced: rows.filter((r) =>
      (r.states as Array<{ status: string }>).some((s) => s.status === "Bounced")
    ).length,
  };
}

// Paginated contacts for the contacts list view.
// For the "all" filter a LEFT join is used so contacts with no campaign states are included.
// For status filters an INNER join restricts to contacts that have at least one matching state.
export async function getContactsPage(
  filter: string,
  page: number
): Promise<ContactRow[]> {
  const userId = await getCurrentUserId();
  const offset = page * CONTACTS_PAGE_SIZE;

  if (filter === "all") {
    const { data, error } = await supabase
      .from("Contact")
      .select("*, states:ContactCampaignState(*, campaign:Campaign(*))")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .range(offset, offset + CONTACTS_PAGE_SIZE - 1);
    if (error) dbLog("getContactsPage(all)", error);
    return (data || []) as ContactRow[];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Inner join: only contacts with at least one CCS matching the filter condition.
  let query = supabase
    .from("Contact")
    .select("*, states:ContactCampaignState!inner(*, campaign:Campaign(*))")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  switch (filter) {
    case "new":
      query = query.eq("states.status", "New");
      break;
    case "today":
      query = query
        .in("states.status", ["Waiting", "Contacted"])
        .lte("states.nextActionDate", today.toISOString());
      break;
    case "replied":
      query = query.eq("states.status", "Replied");
      break;
    case "completed":
      query = query.eq("states.status", "Completed");
      break;
    case "bounced":
      query = query.eq("states.status", "Bounced");
      break;
  }

  const { data, error } = await query.range(offset, offset + CONTACTS_PAGE_SIZE - 1);
  if (error) dbLog(`getContactsPage(${filter})`, error);
  return (data || []) as ContactRow[];
}

export type ContactImportRow = {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  industry?: string;
  city?: string;
  timezone?: string;
  status?: string;
  linkedinUrl?: string;
  tags?: string[];
};

export async function getContacts(): Promise<ContactRow[]> {
  const userId = await getCurrentUserId();
  const contacts: ContactRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("Contact")
      .select(`*, states:ContactCampaignState(*, campaign:Campaign(*))`)
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (error) { dbLog("getContacts", error); break; }
    contacts.push(...((data || []) as ContactRow[]));
    if (!data || data.length < 500) break;
  }
  return contacts;
}

export async function importContacts(
  contactsData: ContactImportRow[],
  campaignId?: string,
  revalidateAfterImport = true
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
  if (!await hasPermission("member")) return { success: false, count: 0, error: "Member access required to import contacts." };
  if (contactsData.length > CONTACT_IMPORT_BATCH_SIZE) return { success: false, count: 0, error: `Import up to ${CONTACT_IMPORT_BATCH_SIZE} contacts per batch.` };
  const userId = await getCurrentUserId();
  const { count: currentCount, error: countError } = await supabase
    .from("Contact").select("id", { count: "exact", head: true }).eq("userId", userId);
  if (countError || currentCount === null) return { success: false, count: 0, error: "Could not check contact limit." };
  let availableSlots = Math.max(0, MAX_CONTACTS - currentCount);
  let importedCount = 0;
  let limitReached = false;
  let failedCount = 0;
  let firstError: string | undefined;
  const insertedContactIds: string[] = [];

  // A batch can contain the same email more than once; keep the latest row.
  const uniqueRows = Array.from(new Map(contactsData.filter((row) => row.email).map((row) => [row.email.trim().toLowerCase(), row])).values());
  const processRow = async (row: ContactImportRow) => {
    if (!row.email) return;

    // maybeSingle() returns null (no error) when no row found — avoids PGRST116
    const { data: existing, error: lookupError } = await supabase
      .from("Contact")
      .select("id, isDNC, isUnsubscribed")
      .eq("email", row.email)
      .eq("userId", userId)
      .maybeSingle();
    if (lookupError) {
      dbLog(`importContacts-lookup(${row.email})`, lookupError);
      failedCount++;
      firstError ??= lookupError.message;
      return;
    }

    if (existing && (existing.isDNC || existing.isUnsubscribed)) return;

    const derivedName =
      row.name ||
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      null;

    let contactId: string | null = null;

    if (existing) {
      // Update existing contact — only overwrite provided fields
      const patch: Record<string, unknown> = {};
      if (derivedName)           patch.name      = derivedName;
      if (row.firstName != null) patch.firstName = row.firstName || null;
      if (row.lastName  != null) patch.lastName  = row.lastName  || null;
      if (row.company   != null) patch.company   = row.company   || null;
      if (row.jobTitle  != null) patch.jobTitle  = row.jobTitle  || null;
      if (row.phone     != null) patch.phone     = row.phone     || null;
      if (row.website   != null) patch.website   = row.website   || null;
      if (row.industry  != null) patch.industry  = row.industry  || null;
      if (row.city      != null) patch.city      = row.city      || null;
      if (row.timezone)          patch.timezone  = row.timezone;
      if (row.status)            patch.status    = row.status;

      if (Object.keys(patch).length) {
        const { error: upErr } = await supabase
          .from("Contact").update(patch).eq("id", existing.id).eq("userId", userId);
        if (upErr) {
          dbLog(`importContacts-update(${row.email})`, upErr);
          failedCount++;
          firstError ??= upErr.message;
          return;
        }
      }
      contactId = existing.id;
    } else {
      if (availableSlots === 0) { limitReached = true; return; }
      availableSlots--;
      // Insert new contact
      const { data, error: insErr } = await supabase
        .from("Contact")
        .insert({
          email: row.email,
          userId,
          name: derivedName,
          firstName: row.firstName || null,
          lastName: row.lastName  || null,
          company:  row.company   || null,
          jobTitle: row.jobTitle  || null,
          phone:    row.phone     || null,
          website:  row.website   || null,
          industry: row.industry  || null,
          city:     row.city      || null,
          timezone: row.timezone  || "Asia/Kolkata",
          status:   row.status    || "New",
        })
        .select("id")
        .single();
      if (insErr || !data) {
        availableSlots++;
        dbLog(`importContacts-insert(${row.email})`, insErr);
        failedCount++;
        firstError ??= insErr?.message || "Contact insert returned no data.";
        return;
      }
      contactId = data.id;
    }

    if (contactId) {
      importedCount++;
      insertedContactIds.push(contactId);

      // Save v6 fields — silently ignored if columns don't exist yet (migration_v6)
      const extras: Record<string, unknown> = {};
      if (row.linkedinUrl)  extras.linkedinUrl      = row.linkedinUrl;
      if (row.tags?.length) extras.tags             = row.tags;
      if (!existing)        extras.unsubscribeToken = crypto.randomUUID();
      if (Object.keys(extras).length) {
        await supabase.from("Contact").update(extras).eq("id", contactId);
      }
    }
  };

  for (let offset = 0; offset < uniqueRows.length; offset += 10) {
    await Promise.all(uniqueRows.slice(offset, offset + 10).map(processRow));
  }

  if (campaignId && insertedContactIds.length > 0) {
    const statesToInsert = insertedContactIds.map((id) => ({
      contactId: id,
      campaignId,
      currentStep: 0,
      status: "New",
    }));
    const { error: campaignError } = await supabase
      .from("ContactCampaignState")
      .upsert(statesToInsert, { onConflict: "contactId,campaignId" });
    if (campaignError) {
      dbLog("importContacts-campaign", campaignError);
      if (revalidateAfterImport) revalidatePath("/contacts");
      return { success: false, count: importedCount, error: "Contacts were saved, but campaign enrollment failed." };
    }
  }

  if (revalidateAfterImport) revalidatePath("/contacts");
  if (limitReached) return { success: false, count: importedCount, error: `Contact limit of ${MAX_CONTACTS.toLocaleString()} reached.` };
  if (failedCount) return { success: false, count: importedCount, error: `${failedCount} contacts could not be saved: ${firstError}` };
  return { success: true, count: importedCount };
  } catch (err: unknown) {
    console.error("[importContacts] unexpected error:", err);
    return { success: false, count: 0, error: err instanceof Error ? err.message : "Unexpected server error" };
  }
}

export async function deleteContact(id: string) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to delete contacts." };
  const userId = await getCurrentUserId();
  await supabase.from("Contact").delete().eq("id", id).eq("userId", userId);
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContact(id: string, data: {
  name?: string; email?: string; company?: string;
  firstName?: string; lastName?: string; jobTitle?: string;
  phone?: string; website?: string; industry?: string;
  city?: string; timezone?: string; status?: string;
}) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to update contacts." };
  const userId = await getCurrentUserId();
  await supabase.from("Contact").update(data).eq("id", id).eq("userId", userId);
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContactStatus(id: string, status: string) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to update contact status." };
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("Contact")
    .update({ status })
    .eq("id", id)
    .eq("userId", userId);

  if (error) { dbLog("updateContactStatus", error); return { success: false, error: error.message }; }
  revalidatePath("/contacts");
  return { success: true };
}

export async function markDNC(id: string) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to mark DNC." };
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("Contact")
    .update({ isDNC: true, status: "Do Not Contact" })
    .eq("id", id)
    .eq("userId", userId);

  if (error) { dbLog("markDNC", error); return { success: false, error: error.message }; }
  revalidatePath("/contacts");
  return { success: true };
}

export async function unsubscribeContact(id: string) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to unsubscribe contacts." };
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("Contact")
    .update({ isUnsubscribed: true, status: "Unsubscribed" })
    .eq("id", id)
    .eq("userId", userId);

  if (error) { dbLog("unsubscribeContact", error); return { success: false, error: error.message }; }
  revalidatePath("/contacts");
  return { success: true };
}

export async function bulkDeleteContacts(ids: string[]) {
  if (!ids.length) return { success: true };
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to bulk delete contacts." };
  const userId = await getCurrentUserId();
  await supabase.from("Contact").delete().in("id", ids).eq("userId", userId);
  revalidatePath("/contacts");
  return { success: true };
}

export async function markAsReplied(contactId: string, campaignId: string, replyNote?: string) {
  if (!await hasPermission("member")) return { success: false, error: "Member access required." };
  const userId = await getCurrentUserId();

  // Verify the contact belongs to this user before updating
  const { data: contact } = await supabase
    .from("Contact").select("id").eq("id", contactId).eq("userId", userId).maybeSingle();
  if (!contact) return { success: false, error: "Contact not found." };

  // Verify the campaign belongs to this user
  const { data: campaign } = await supabase
    .from("Campaign").select("id").eq("id", campaignId).eq("userId", userId).maybeSingle();
  if (!campaign) return { success: false, error: "Campaign not found." };

  const { error } = await supabase
    .from("ContactCampaignState")
    .update({
      status: "Replied",
      repliedAt: new Date().toISOString(),
      replyNote: replyNote?.trim() || null,
      nextActionDate: null,
    })
    .match({ contactId, campaignId });

  if (error) { dbLog("markAsReplied", error); return { success: false, error: error.message }; }

  await supabase.from("Contact").update({ status: "Replied" }).eq("id", contactId).eq("userId", userId);

  revalidatePath("/contacts");
  revalidatePath("/campaigns");
  return { success: true };
}

export async function bulkAddToCampaign(contactIds: string[], campaignId: string) {
  if (!contactIds.length || !campaignId) return { success: true };
  if (!await hasPermission("member")) return { success: false, error: "Member access required to add contacts to campaigns." };
  const userId = await getCurrentUserId();

  // Verify campaign ownership
  const { data: campaign } = await supabase
    .from("Campaign").select("id").eq("id", campaignId).eq("userId", userId).maybeSingle();
  if (!campaign) return { success: false, error: "Campaign not found." };

  // Only add contacts that belong to this user
  const { data: ownedContacts } = await supabase
    .from("Contact").select("id").in("id", contactIds).eq("userId", userId);
  const safeIds = (ownedContacts || []).map((c) => c.id);
  if (!safeIds.length) return { success: true };

  const statesToInsert = safeIds.map((id) => ({
    contactId: id,
    campaignId,
    currentStep: 0,
    status: "New",
  }));
  await supabase
    .from("ContactCampaignState")
    .upsert(statesToInsert, { onConflict: "contactId,campaignId" });
  revalidatePath("/contacts");
  return { success: true };
}
