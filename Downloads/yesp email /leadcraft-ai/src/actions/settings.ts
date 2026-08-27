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
}) {
  if (!await hasPermission("owner")) return { success: false, error: "Only the workspace owner can change settings." };
  const userId = await getCurrentUserId();

  // Fetch existing row to detect reportingEmail change and get the stored resendKey
  const { data: existing } = await supabase
    .from("Settings").select("reportingEmail, resendKey").eq("id", userId).maybeSingle();

  const prevReportingEmail = existing?.reportingEmail ?? null;
  const newReportingEmail  = settings.reportingEmail?.trim() || null;
  const reportingEmailChanged = !!(newReportingEmail && newReportingEmail !== prevReportingEmail);

  // The effective API key: use the one being saved (if provided), else the stored one
  const effectiveApiKey = (settings.resendKey?.trim() || existing?.resendKey || "").trim();

  const { error } = await supabase.from("Settings").upsert({ id: userId, ...settings });
  if (error) {
    dbLog("updateSettings", error);
    return { success: false, error: error.message ?? "Failed to save settings." };
  }

  revalidatePath("/settings");

  // Send confirmation test email if reporting email was set/changed
  if (reportingEmailChanged) {
    if (!effectiveApiKey) {
      return { success: true, emailWarning: "Settings saved, but no Resend API key is configured — reporting confirmation email was not sent." };
    }
    try {
      await sendReportingEmailConfirmation(newReportingEmail!, effectiveApiKey);
      return { success: true, emailSent: true };
    } catch (e: any) {
      return { success: true, emailWarning: `Settings saved, but confirmation email failed: ${e.message}` };
    }
  }

  return { success: true };
}
