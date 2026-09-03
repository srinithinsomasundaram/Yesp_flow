"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/auth-helper";
import { dbLog } from "@/lib/db-error";
import { buildTransporter, buildFromStr } from "@/lib/send-engine";

export interface RunLogSummary {
  id: string;
  campaignId: string | null;
  status: string;
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  totalSent: number;
  totalSkipped: number;
  totalFailed: number;
  reportSent: boolean | null;
}

export async function getCampaignRunLogs(campaignId: string): Promise<RunLogSummary[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("CampaignRunLog")
    .select("id, campaignId, status, triggeredBy, startedAt, completedAt, totalSent, totalSkipped, totalFailed, reportSent")
    .eq("campaignId", campaignId)
    .eq("userId", userId)
    .order("startedAt", { ascending: false })
    .limit(25);
  if (error) dbLog("getCampaignRunLogs", error);
  return (data || []) as RunLogSummary[];
}

export async function sendReplyEmail(params: {
  contactEmail: string;
  contactName: string | null;
  contactId: string;
  campaignId: string;
  originalSubject: string;
  replyBody: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();

    // Get campaign + email account
    const { data: campaign } = await supabase
      .from("Campaign")
      .select("emailAccountId, name")
      .eq("id", params.campaignId)
      .eq("userId", userId)
      .single();

    // Get global settings for fallback
    const { data: settings } = await supabase
      .from("Settings")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    let account = null;
    if (campaign?.emailAccountId) {
      const { data: acct } = await supabase
        .from("EmailAccount")
        .select("*")
        .eq("id", campaign.emailAccountId)
        .eq("userId", userId)
        .single();
      account = acct;
    }

    const fromStr = buildFromStr(account, settings ?? {});
    if (!fromStr) return { success: false, error: "No sender email configured." };

    const transporter = buildTransporter(account, settings ?? {});
    const subject = params.originalSubject.startsWith("Re:")
      ? params.originalSubject
      : `Re: ${params.originalSubject}`;

    const htmlBody = params.replyBody.replace(/\n/g, "<br>");

    await transporter.sendMail({
      from: fromStr,
      to: params.contactEmail,
      subject,
      text: params.replyBody,
      html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1e293b;">${htmlBody}</div>`,
    });

    // Log the reply as EmailActivity
    await supabase.from("EmailActivity").insert({
      userId,
      contactId: params.contactId,
      campaignId: params.campaignId,
      type: "reply_sent",
      timestamp: new Date().toISOString(),
      resendStatus: "sent",
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
