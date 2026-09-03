"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId } from "@/lib/auth-helper";
import type { ActivityRow } from "@/types/db";
import { ACTIVITY_PAGE_SIZE } from "@/lib/pagination";

export async function getEmailActivity(
  limit = ACTIVITY_PAGE_SIZE,
  offset = 0
): Promise<ActivityRow[]> {
  const userId = await getCurrentUserId();

  // Filter directly by userId — avoids building a huge .in([...contactIds]) URL
  // that blows undici's 16 KB header limit when the contact list is large.
  const { data, error } = await supabase
    .from("EmailActivity")
    .select(
      `id, type, timestamp, resendStatus, deliveredAt, openedAt, clickedAt, bouncedAt, complainedAt,
       contact:Contact (id, name, email, company)`
    )
    .eq("userId", userId)
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) dbLog("getEmailActivity", error);
  return (data || []) as unknown as ActivityRow[];
}
