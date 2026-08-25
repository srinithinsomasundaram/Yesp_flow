"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { getSettings } from "./settings";

// ── Helpers ──────────────────────────────────────────────────────────────

function calculateNextDate(amount: number, unit: string): Date {
  const next = new Date();
  switch (unit) {
    case "minutes":
      next.setMinutes(next.getMinutes() + amount);
      break;
    case "hours":
      next.setHours(next.getHours() + amount);
      break;
    case "business_days": {
      let added = 0;
      while (added < amount) {
        next.setDate(next.getDate() + 1);
        const dow = next.getDay();
        if (dow !== 0 && dow !== 6) added++;
      }
      break;
    }
    default: // "days"
      next.setDate(next.getDate() + amount);
  }
  return next;
}

function getLocalTimeStr(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(/^24/, "00");
}

function getLocalDayStr(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(new Date());
}

function isWithinSendWindow(campaign: any): boolean {
  const tz = campaign.timezone || "Asia/Kolkata";
  const start = campaign.startTime || "09:00";
  const end = campaign.endTime || "17:00";
  const now = getLocalTimeStr(tz);
  return now >= start && now <= end;
}

function isAllowedDay(campaign: any): boolean {
  const tz = campaign.timezone || "Asia/Kolkata";
  const allowed = (campaign.sendingDays || "Mon,Tue,Wed,Thu,Fri")
    .split(",")
    .map((d: string) => d.trim());
  return allowed.includes(getLocalDayStr(tz));
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function applyMergeTags(text: string, contact: any): string {
  const fullName =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    "";
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

function buildTransporter(account: any | null, globalSettings: any): nodemailer.Transporter {
  if (account) {
    const isResend = account.provider === "resend";
    return nodemailer.createTransport({
      host: isResend ? "smtp.resend.com" : account.smtpHost,
      port: account.smtpPort || 465,
      secure: (account.smtpPort || 465) === 465,
      auth: {
        user: isResend ? "resend" : account.smtpUser,
        pass: isResend ? account.resendApiKey : account.smtpPass,
      },
    });
  }
  return nodemailer.createTransport({
    host: globalSettings.smtpHost || "smtp.resend.com",
    port: globalSettings.smtpPort || 465,
    secure: (globalSettings.smtpPort || 465) === 465,
    auth: { user: "resend", pass: globalSettings.resendKey },
  });
}

function buildFromStr(account: any | null, globalSettings: any): string | null {
  if (account?.senderEmail) {
    return account.senderName
      ? `"${account.senderName}" <${account.senderEmail}>`
      : account.senderEmail;
  }
  if (globalSettings.fromEmail) {
    return globalSettings.fromName
      ? `"${globalSettings.fromName}" <${globalSettings.fromEmail}>`
      : globalSettings.fromEmail;
  }
  return null;
}

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
    supabase
      .from("ContactCampaignState")
      .select("*", { count: "exact", head: true })
      .eq("status", "New"),
    supabase
      .from("ContactCampaignState")
      .select("*", { count: "exact", head: true })
      .in("status", ["Contacted", "Waiting"])
      .lte("nextActionDate", new Date().toISOString()),
    supabase
      .from("ContactCampaignState")
      .select("*", { count: "exact", head: true })
      .eq("status", "Replied"),
    supabase
      .from("ContactCampaignState")
      .select("*", { count: "exact", head: true })
      .eq("status", "Bounced"),
    supabase
      .from("ContactCampaignState")
      .select(
        `*, contact:Contact (*), campaign:Campaign (*, steps:CampaignStep (*, template:Template (*)))`
      )
      .or(
        `status.eq.New,and(status.in.(Contacted,Waiting),nextActionDate.lte.${new Date().toISOString()})`
      )
      .limit(50),
  ]);

  return {
    newContacts: newContacts || 0,
    followUps: followUps || 0,
    replies: replies || 0,
    bounced: bounced || 0,
    actions: actionsData || [],
  };
}

// ── Sending Engine ───────────────────────────────────────────────────────

export async function triggerFollowUps(campaignId?: string, force = false) {
  const settings = await getSettings();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // ── Step 1: fetch candidate states ───────────────────────────────────────
  // Use simple .in() + filter in JS — avoids broken nested or(and()) syntax
  // and avoids FK joins that require Supabase schema registration.
  let statesQuery = supabase
    .from("ContactCampaignState")
    .select(`*, contact:Contact (*)`)
    .in("status", ["New", "Contacted", "Waiting"]);

  if (campaignId) statesQuery = statesQuery.eq("campaignId", campaignId);

  const { data: allStates, error: statesErr } = await statesQuery.limit(100);

  if (statesErr) {
    console.error("[triggerFollowUps] states query failed:", statesErr.message);
    return { success: false, processedCount: 0, skipped: 0, errors: [statesErr.message] };
  }

  // Filter to states that are actually due
  const pendingStates = (allStates || []).filter((s) =>
    s.status === "New" ||
    (["Contacted", "Waiting"].includes(s.status) &&
      s.nextActionDate &&
      new Date(s.nextActionDate) <= now)
  );

  if (pendingStates.length === 0) {
    return { success: true, processedCount: 0, skipped: 0, errors: [] };
  }

  // ── Step 2: caches to avoid redundant DB calls per campaign ──────────────
  const campaignCache: Record<string, any> = {};
  const emailAccountCache: Record<string, any> = {};
  const stepsCache: Record<string, any[]> = {};
  const campaignDailyCounts: Record<string, number> = {};
  const transporterCache: Record<string, nodemailer.Transporter> = {};

  let processedCount = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const state of pendingStates) {
    const contact = state.contact;
    if (!contact?.email) { skipped++; continue; }
    if (contact.isDNC || contact.isUnsubscribed) { skipped++; continue; }

    // ── Load campaign (cached) ──────────────────────────────────────────
    if (!campaignCache[state.campaignId]) {
      const { data: camp } = await supabase
        .from("Campaign")
        .select("*")
        .eq("id", state.campaignId)
        .single();
      if (!camp) { skipped++; continue; }
      campaignCache[state.campaignId] = camp;
    }
    const campaign = campaignCache[state.campaignId];

    // ── Send window / day checks (skipped when force = true) ────────────
    if (!force && !isWithinSendWindow(campaign)) { skipped++; continue; }
    if (!force && !isAllowedDay(campaign)) { skipped++; continue; }

    // ── Daily limit ─────────────────────────────────────────────────────
    if (!(campaign.id in campaignDailyCounts)) {
      const { count } = await supabase
        .from("EmailActivity")
        .select("*", { count: "exact", head: true })
        .eq("campaignId", campaign.id)
        .gte("timestamp", todayStart.toISOString());
      campaignDailyCounts[campaign.id] = count || 0;
    }
    if (campaignDailyCounts[campaign.id] >= (campaign.dailyLimit || 200)) { skipped++; continue; }

    // ── Email account (cached per campaign) ─────────────────────────────
    if (!(campaign.id in emailAccountCache)) {
      let acct = null;
      if (campaign.emailAccountId) {
        const { data } = await supabase
          .from("EmailAccount")
          .select("*")
          .eq("id", campaign.emailAccountId)
          .single();
        acct = data?.isActive ? data : null;
      }
      emailAccountCache[campaign.id] = acct;
    }
    const account = emailAccountCache[campaign.id];

    // ── Validate sending credentials ─────────────────────────────────────
    if (!account && !settings.resendKey) {
      errors.push(`"${campaign.name}": no email account linked and no API key in Settings.`);
      skipped++;
      continue;
    }
    const fromStr = buildFromStr(account, settings);
    if (!fromStr) {
      errors.push(`"${campaign.name}": no sender email — open Campaign Settings and link an Email Account.`);
      skipped++;
      continue;
    }

    // ── Steps (cached per campaign) ──────────────────────────────────────
    if (!stepsCache[campaign.id]) {
      const { data: steps } = await supabase
        .from("CampaignStep")
        .select(`*, template:Template(*)`)
        .eq("campaignId", campaign.id)
        .order("stepNumber", { ascending: true });
      stepsCache[campaign.id] = steps || [];
    }
    const steps = stepsCache[campaign.id];
    const currentStepNumber = state.currentStep ?? 0;
    const currentStep = steps.find((s) => s.stepNumber === currentStepNumber);
    const nextStep = steps.find((s) => s.stepNumber === currentStepNumber + 1);

    if (!currentStep?.template) {
      errors.push(`"${campaign.name}": step ${currentStepNumber} has no template attached.`);
      skipped++;
      continue;
    }

    // ── Build transporter (cached per campaign) ──────────────────────────
    if (!transporterCache[campaign.id]) {
      transporterCache[campaign.id] = buildTransporter(account, settings);
    }
    const transporter = transporterCache[campaign.id];
    const replyToStr = account?.replyTo || settings.replyTo || undefined;

    // ── Compose email ────────────────────────────────────────────────────
    const template = currentStep.template;
    const subject = applyMergeTags(template.subject || "", contact);
    let body = applyMergeTags(template.body || "", contact);
    if (template.signature) body += `\n\n${template.signature}`;
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlBody = isHtml ? body : body.replace(/\n/g, "<br />");
    const plainBody = isHtml ? htmlToText(body) : body;

    try {
      await transporter.sendMail({
        from: fromStr,
        to: contact.email,
        replyTo: replyToStr,
        subject,
        html: htmlBody,
        text: plainBody,
        headers: {
          "X-Mailer": "YESPFLOW",
          "Precedence": "bulk",
        },
        attachments: (template.attachments || []).map((a: any) => ({
          filename: a.name,
          href: a.url,
        })),
      });

      // Log activity
      await supabase.from("EmailActivity").insert([{
        contactId: state.contactId,
        campaignId: campaign.id,
        type: `Step ${currentStepNumber + 1}: ${template.name}`,
      }]);

      // Advance state
      if (nextStep) {
        const nextDate = calculateNextDate(nextStep.delayDays || 1, nextStep.delayUnit || "days");
        await supabase
          .from("ContactCampaignState")
          .update({ currentStep: currentStepNumber + 1, status: "Waiting", lastSent: now.toISOString(), nextActionDate: nextDate.toISOString() })
          .eq("id", state.id);
      } else {
        await supabase
          .from("ContactCampaignState")
          .update({ status: "Completed", lastSent: now.toISOString(), nextActionDate: null })
          .eq("id", state.id);
      }

      campaignDailyCounts[campaign.id]++;
      processedCount++;
    } catch (err: any) {
      const msg = err?.message ?? "Unknown send error";
      errors.push(`${contact.email}: ${msg}`);
      await supabase
        .from("ContactCampaignState")
        .update({ status: "Bounced", stoppedReason: msg })
        .eq("id", state.id);
    }
  }

  revalidatePath("/");
  return { success: true, processedCount, skipped, errors };
}

// ── Test Send ─────────────────────────────────────────────────────────────

export async function sendTestEmail(
  campaignId: string,
  stepId: string,
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  const settings = await getSettings();

  // Fetch campaign (plain — avoid FK join that may not be registered in Supabase schema)
  const { data: campaign, error: campErr } = await supabase
    .from("Campaign")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campErr || !campaign) {
    return { success: false, error: `Campaign not found: ${campErr?.message ?? "no data returned"}` };
  }

  // Fetch email account separately if linked
  let emailAccount: any = null;
  if (campaign.emailAccountId) {
    const { data: acct } = await supabase
      .from("EmailAccount")
      .select("*")
      .eq("id", campaign.emailAccountId)
      .single();
    emailAccount = acct ?? null;
  }

  const { data: step, error: stepErr } = await supabase
    .from("CampaignStep")
    .select(`*, template:Template(*)`)
    .eq("id", stepId)
    .single();

  if (stepErr || !step?.template) {
    return { success: false, error: `Step not found: ${stepErr?.message ?? "no template attached"}` };
  }

  const template = step.template;
  const account = emailAccount?.isActive ? emailAccount : null;

  if (!account && !settings.resendKey) {
    return { success: false, error: "No email account linked to this campaign. Go to campaign settings and assign one." };
  }

  const fromStr = buildFromStr(account, settings);
  if (!fromStr) {
    return { success: false, error: "No sender email configured. Link an Email Account to this campaign in campaign settings." };
  }

  // Dummy contact values so merge tags render realistically
  const dummyContact = {
    name: "Alex Johnson",
    firstName: "Alex",
    lastName: "Johnson",
    email: toEmail,
    company: "Acme Corp",
    jobTitle: "Marketing Manager",
    city: "New York",
    phone: "+1 555-0100",
    website: "acmecorp.com",
    industry: "Technology",
  };

  const subject = `[TEST] ${applyMergeTags(template.subject || "", dummyContact)}`;
  let body = applyMergeTags(template.body || "", dummyContact);
  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  const htmlBody = isHtml ? body : body.replace(/\n/g, "<br />");
  const plainBody = isHtml ? htmlToText(body) : body;

  const transporter = buildTransporter(account, settings);

  try {
    await transporter.sendMail({
      from: fromStr,
      to: toEmail,
      subject,
      html: htmlBody,
      text: plainBody,
      attachments: (template.attachments || []).map((a: any) => ({
        filename: a.name,
        href: a.url,
      })),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to send test email." };
  }
}
