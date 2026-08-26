"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId, hasPermission } from "@/lib/auth-helper";
import { sendReportingEmailConfirmation } from "@/lib/app-mailer";

export async function getSettings() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("Settings").select("*").eq("id", userId).single();
  if (error) {
    if (error.code === "PGRST116") return {};
    dbLog("getSettings", error);
    return {};
  }
  return data || {};
}

export async function updateSettings(settings: {
  resendKey?:      string;
  reportingEmail?: string;
  fromName?:       string;
  fromEmail?:      string;
  replyTo?:        string;
  smtpHost?:       string;
  smtpPort?:       number;
}) {
  if (!await hasPermission("owner")) return { success: false, error: "Only the workspace owner can change settings." };
  const userId = await getCurrentUserId();

  // Check if reportingEmail is being set or changed
  const { data: existing } = await supabase.from("Settings").select("reportingEmail").eq("id", userId).maybeSingle();
  const prevReportingEmail = existing?.reportingEmail ?? null;
  const newReportingEmail  = settings.reportingEmail?.trim() || null;
  const reportingEmailChanged = newReportingEmail && newReportingEmail !== prevReportingEmail;

  const { error } = await supabase.from("Settings").upsert({ id: userId, ...settings });
  if (error) {
    dbLog("updateSettings", error);
    return { success: false, error: error.message ?? "Failed to save settings." };
  }

  // Fire confirmation email (non-blocking — don't fail the save if this errors)
  if (reportingEmailChanged) {
    sendReportingEmailConfirmation(newReportingEmail).catch((e) =>
      console.error("[settings] reporting confirmation email failed:", e.message)
    );
  }

  revalidatePath("/settings");
  return { success: true };
}
