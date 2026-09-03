"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId, hasPermission } from "@/lib/auth-helper";
import { sendReportingEmailConfirmation, sendTestMail } from "@/lib/app-mailer";

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
  resendKey?:              string;
  reportingEmail?:         string;
  fromName?:               string;
  fromEmail?:              string;
  replyTo?:                string;
  smtpHost?:               string;
  smtpPort?:               number;
  runLimit?:               number;
  automationEnabled?:      boolean;
  automationIntervalMins?: number;
  webhookOutUrl?:          string;
}) {
  if (!await hasPermission("owner")) return { success: false, error: "Only the workspace owner can change settings." };
  const userId = await getCurrentUserId();

  // Fetch existing row to detect reportingEmail change
  const { data: existing } = await supabase
    .from("Settings").select("reportingEmail").eq("id", userId).maybeSingle();

  const prevReportingEmail = existing?.reportingEmail ?? null;
  const newReportingEmail  = settings.reportingEmail?.trim() || null;
  const reportingEmailChanged = !!(newReportingEmail && newReportingEmail !== prevReportingEmail);

  const { error } = await supabase.from("Settings").upsert({ id: userId, ...settings });
  if (error) {
    dbLog("updateSettings", error);
    return { success: false, error: error.message ?? "Failed to save settings." };
  }

  revalidatePath("/settings");

  // Send confirmation email if reporting address was set/changed
  if (reportingEmailChanged) {
    try {
      await sendReportingEmailConfirmation(newReportingEmail!);
      return { success: true, emailSent: true };
    } catch (e: any) {
      return { success: true, emailWarning: `Settings saved, but confirmation email failed: ${e.message}` };
    }
  }

  return { success: true };
}

export async function sendTestEmail(): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  const { data: settings } = await supabase
    .from("Settings")
    .select("reportingEmail")
    .eq("id", userId)
    .maybeSingle();

  if (!settings?.reportingEmail) {
    return { success: false, error: "No reporting email configured. Save a reporting email first." };
  }

  try {
    await sendTestMail(settings.reportingEmail);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
