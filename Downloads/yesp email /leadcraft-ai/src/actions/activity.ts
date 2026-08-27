"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId } from "@/lib/auth-helper";

export async function getEmailActivity(limit = 200) {
  const userId = await getCurrentUserId();

  // Get this user's contact IDs first, then filter activity
  const { data: contacts } = await supabase
    .from("Contact")
    .select("id")
    .eq("userId", userId);

  const contactIds = (contacts || []).map((c) => c.id);
  if (!contactIds.length) return [];

  const { data, error } = await supabase
    .from("EmailActivity")
    .select(`id, type, timestamp, resendStatus, deliveredAt, openedAt, clickedAt, bouncedAt, complainedAt, contact:Contact (id, name, email, company)`)
    .in("contactId", contactIds)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) dbLog("getEmailActivity", error);
  return data || [];
}
