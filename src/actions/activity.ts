"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";

export async function getEmailActivity(limit = 200) {
  const { data, error } = await supabase
    .from("EmailActivity")
    .select(`
      *,
      contact:Contact (id, name, email, company)
    `)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) dbLog("getEmailActivity", error);
  return data || [];
}
