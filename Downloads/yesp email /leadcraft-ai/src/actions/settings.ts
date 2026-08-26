"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId } from "@/lib/auth-helper";

export async function getSettings() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("Settings")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return {};
    dbLog("getSettings", error);
    return {};
  }
  return data || {};
}

export async function updateSettings(settings: { resendKey: string }) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("Settings")
    .upsert({ id: userId, ...settings });

  if (error) {
    dbLog("updateSettings", error);
    return { success: false, error: error.message ?? "Failed to save settings." };
  }

  revalidatePath("/settings");
  return { success: true };
}
