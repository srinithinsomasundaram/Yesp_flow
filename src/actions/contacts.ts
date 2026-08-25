"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";

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
};

export async function getContacts() {
  const { data, error } = await supabase
    .from("Contact")
    .select(`
      *,
      states:ContactCampaignState (
        *,
        campaign:Campaign (*)
      )
    `)
    .order("createdAt", { ascending: false });

  if (error) dbLog("getContacts", error);
  return data || [];
}

export async function importContacts(
  contactsData: ContactImportRow[],
  campaignId?: string
) {
  let importedCount = 0;
  const insertedContactIds: string[] = [];

  for (const row of contactsData) {
    if (!row.email) continue;

    // Check if DNC or unsubscribed flag exists on existing record
    const { data: existing } = await supabase
      .from("Contact")
      .select("id, isDNC, isUnsubscribed")
      .eq("email", row.email)
      .single();

    // Skip DNC or unsubscribed contacts
    if (existing && (existing.isDNC || existing.isUnsubscribed)) {
      console.log(`Skipping DNC/unsubscribed contact: ${row.email}`);
      continue;
    }

    // Build the full name from firstName/lastName if no explicit name
    const derivedName =
      row.name ||
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      null;

    const { data: contact, error } = await supabase
      .from("Contact")
      .upsert(
        {
          email: row.email,
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
        },
        { onConflict: "email" }
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

  // If a campaign is selected, add all these contacts to the campaign
  if (campaignId && insertedContactIds.length > 0) {
    const statesToInsert = insertedContactIds.map((id) => ({
      contactId: id,
      campaignId: campaignId,
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
  await supabase.from("Contact").delete().eq("id", id);
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContact(
  id: string,
  data: {
    name?: string;
    email?: string;
    company?: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    phone?: string;
    website?: string;
    industry?: string;
    city?: string;
    timezone?: string;
    status?: string;
  }
) {
  await supabase.from("Contact").update(data).eq("id", id);
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContactStatus(id: string, status: string) {
  const { error } = await supabase
    .from("Contact")
    .update({ status })
    .eq("id", id);

  if (error) {
    dbLog("updateContactStatus", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { success: true };
}

export async function markDNC(id: string) {
  const { error } = await supabase
    .from("Contact")
    .update({ isDNC: true, status: "Do Not Contact" })
    .eq("id", id);

  if (error) {
    dbLog("markDNC", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { success: true };
}

export async function unsubscribeContact(id: string) {
  const { error } = await supabase
    .from("Contact")
    .update({ isUnsubscribed: true, status: "Unsubscribed" })
    .eq("id", id);

  if (error) {
    dbLog("unsubscribeContact", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { success: true };
}

export async function bulkDeleteContacts(ids: string[]) {
  if (ids.length === 0) return { success: true };
  await supabase.from("Contact").delete().in("id", ids);
  revalidatePath("/contacts");
  return { success: true };
}

export async function bulkAddToCampaign(contactIds: string[], campaignId: string) {
  if (contactIds.length === 0 || !campaignId) return { success: true };

  const statesToInsert = contactIds.map((id) => ({
    contactId: id,
    campaignId: campaignId,
    currentStep: 0,
    status: "New",
  }));

  await supabase
    .from("ContactCampaignState")
    .upsert(statesToInsert, { onConflict: "contactId,campaignId" });
  revalidatePath("/contacts");
  return { success: true };
}
