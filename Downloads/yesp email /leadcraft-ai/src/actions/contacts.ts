"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId, hasPermission } from "@/lib/auth-helper";

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

export async function getContacts() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("Contact")
    .select(`
      *,
      states:ContactCampaignState (
        *,
        campaign:Campaign (*)
      )
    `)
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) dbLog("getContacts", error);
  return data || [];
}

export async function importContacts(
  contactsData: ContactImportRow[],
  campaignId?: string
) {
  if (!await hasPermission("member")) return { success: false, count: 0, error: "Member access required to import contacts." };
  const userId = await getCurrentUserId();
  let importedCount = 0;
  const insertedContactIds: string[] = [];

  for (const row of contactsData) {
    if (!row.email) continue;

    const { data: existing } = await supabase
      .from("Contact")
      .select("id, isDNC, isUnsubscribed")
      .eq("email", row.email)
      .eq("userId", userId)
      .single();

    if (existing && (existing.isDNC || existing.isUnsubscribed)) continue;

    const derivedName =
      row.name ||
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      null;

    const { data: contact, error } = await supabase
      .from("Contact")
      .upsert(
        {
          email: row.email,
          userId,
          name: derivedName,
          firstName: row.firstName || null,
          lastName: row.lastName || null,
          company: row.company || null,
          jobTitle: row.jobTitle || null,
          phone: row.phone || null,
          website: row.website || null,
          industry: row.industry || null,
          city: row.city || null,
          timezone: row.timezone || "Asia/Kolkata",
          status: row.status || "New",
          linkedinUrl: row.linkedinUrl || null,
          tags: row.tags?.length ? row.tags : [],
          unsubscribeToken: crypto.randomUUID(),
        },
        { onConflict: "email,userId" }
      )
      .select("id")
      .single();

    if (!error && contact) {
      importedCount++;
      insertedContactIds.push(contact.id);
    } else {
      dbLog(`importContacts(${row.email})`, error);
    }
  }

  if (campaignId && insertedContactIds.length > 0) {
    const statesToInsert = insertedContactIds.map((id) => ({
      contactId: id,
      campaignId,
      currentStep: 0,
      status: "New",
    }));
    await supabase
      .from("ContactCampaignState")
      .upsert(statesToInsert, { onConflict: "contactId,campaignId" });
  }

  revalidatePath("/contacts");
  return { success: true, count: importedCount };
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

  // Also update the contact's own status to Replied
  await supabase.from("Contact").update({ status: "Replied" }).eq("id", contactId);

  revalidatePath("/contacts");
  revalidatePath("/campaigns");
  return { success: true };
}

export async function bulkAddToCampaign(contactIds: string[], campaignId: string) {
  if (!contactIds.length || !campaignId) return { success: true };
  if (!await hasPermission("member")) return { success: false, error: "Member access required to add contacts to campaigns." };
  const statesToInsert = contactIds.map((id) => ({
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
