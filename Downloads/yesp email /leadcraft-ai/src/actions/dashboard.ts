"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { getSettings } from "./settings";
import { getCurrentUserId } from "@/lib/auth-helper";
import { runSendEngine, htmlToText } from "@/lib/send-engine";

// ── Dashboard Metrics ────────────────────────────────────────────────────

export async function getDashboardMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: newContacts },
    { count: followUps },
    { count: replies },
    { count: bounced },
    { data: actionsData },
  ] = await Promise.all([
    supabase.from("ContactCampaignState").select("*", { count: "exact", head: true }).eq("status", "New"),
    supabase.from("ContactCampaignState").select("*", { count: "exact", head: true }).in("status", ["Contacted", "Waiting"]).lte("nextActionDate", new Date().toISOString()),
    supabase.from("ContactCampaignState").select("*", { count: "exact", head: true }).eq("status", "Replied"),
    supabase.from("ContactCampaignState").select("*", { count: "exact", head: true }).eq("status", "Bounced"),
    supabase.from("ContactCampaignState").select(`*, contact:Contact (*), campaign:Campaign (*, steps:CampaignStep (*, template:Template (*)))`).or(`status.eq.New,and(status.in.(Contacted,Waiting),nextActionDate.lte.${new Date().toISOString()})`).limit(50),
  ]);

  return {
    newContacts: newContacts || 0,
    followUps:   followUps   || 0,
    replies:     replies     || 0,
    bounced:     bounced     || 0,
    actions:     actionsData || [],
  };
}

// ── Sending Engine (server action — no streaming, used by cron/worker) ───

export async function triggerFollowUps(campaignId?: string, force = false) {
  const settings = await getSettings();
  const userId = await getCurrentUserId().catch(() => "system");

  const result = await runSendEngine({
    campaignId, force, userId, triggeredBy: force ? "manual" : "cron", settings,
  });

  revalidatePath("/");
  return result;
}

// ── Test Send ─────────────────────────────────────────────────────────────

function applyMergeTags(text: string, contact: any): string {
  const fullName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "";
  const tags: Record<string, string> = {
    "{{name}}": fullName,
    "{{firstName}}": contact.firstName || fullName.split(" ")[0] || "",
    "{{lastName}}": contact.lastName || fullName.split(" ").slice(1).join(" ") || "",
    "{{email}}": contact.email || "",
    "{{company}}": contact.company || "",
    "{{jobTitle}}": contact.jobTitle || "",
    "{{city}}": contact.city || "",
    "{{phone}}": contact.phone || "",
    "{{website}}": contact.website || "",
    "{{industry}}": contact.industry || "",
  };
  let result = text;
  for (const [tag, value] of Object.entries(tags)) {
    result = result.replace(new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  return result;
}

function buildTransporter(account: any | null, settings: any): nodemailer.Transporter {
  if (account) {
    const isResend = account.provider === "resend";
    return nodemailer.createTransport({
      host: isResend ? "smtp.resend.com" : account.smtpHost,
      port: account.smtpPort || 465,
      secure: (account.smtpPort || 465) === 465,
      auth: { user: isResend ? "resend" : account.smtpUser, pass: isResend ? account.resendApiKey : account.smtpPass },
    });
  }
  return nodemailer.createTransport({
    host: settings.smtpHost || "smtp.resend.com", port: settings.smtpPort || 465,
    secure: (settings.smtpPort || 465) === 465, auth: { user: "resend", pass: settings.resendKey },
  });
}

function buildFromStr(account: any | null, settings: any): string | null {
  if (account?.senderEmail)
    return account.senderName ? `"${account.senderName}" <${account.senderEmail}>` : account.senderEmail;
  if (settings.fromEmail)
    return settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
  return null;
}

export async function sendTestEmail(
  campaignId: string,
  stepId: string,
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getSettings();

  const { data: campaign, error: campErr } = await supabase.from("Campaign").select("*").eq("id", campaignId).single();
  if (campErr || !campaign) return { success: false, error: `Campaign not found: ${campErr?.message ?? "no data"}` };

  let emailAccount: any = null;
  if (campaign.emailAccountId) {
    const { data: acct } = await supabase.from("EmailAccount").select("*").eq("id", campaign.emailAccountId).single();
    emailAccount = acct ?? null;
  }

  const { data: step, error: stepErr } = await supabase.from("CampaignStep").select(`*, template:Template(*)`).eq("id", stepId).single();
  if (stepErr || !step?.template) return { success: false, error: `Step not found: ${stepErr?.message ?? "no template"}` };

  const template = step.template;
  const account  = emailAccount?.isActive ? emailAccount : null;

  if (!account && !settings.resendKey) return { success: false, error: "No email account linked and no API key in Settings." };
  const fromStr = buildFromStr(account, settings);
  if (!fromStr) return { success: false, error: "No sender email configured." };

  const dummyContact = {
    name: "Alex Johnson", firstName: "Alex", lastName: "Johnson", email: toEmail,
    company: "Acme Corp", jobTitle: "Marketing Manager", city: "New York",
    phone: "+1 555-0100", website: "acmecorp.com", industry: "Technology",
  };

  const subject  = `[TEST] ${applyMergeTags(template.subject || "", dummyContact)}`;
  let   body     = applyMergeTags(template.body || "", dummyContact);
  const isHtml   = /<[a-z][\s\S]*>/i.test(body);
  const htmlBody  = isHtml ? body : body.replace(/\n/g, "<br />");
  const plainBody = isHtml ? htmlToText(body) : body;

  try {
    await buildTransporter(account, settings).sendMail({
      from: fromStr, to: toEmail, subject, html: htmlBody, text: plainBody,
      attachments: (template.attachments || []).map((a: any) => ({ filename: a.name, href: a.url })),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to send test email." };
  }
}
