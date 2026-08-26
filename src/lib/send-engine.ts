import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";
import { generateRunReportPDF, RunLogEntry, RunSummary } from "@/lib/pdf-report";

// ── Helpers ────────────────────────────────────────────────────────────────

function calculateNextDate(amount: number, unit: string): Date {
  const next = new Date();
  switch (unit) {
    case "minutes": next.setMinutes(next.getMinutes() + amount); break;
    case "hours":   next.setHours(next.getHours() + amount); break;
    case "business_days": {
      let added = 0;
      while (added < amount) {
        next.setDate(next.getDate() + 1);
        const dow = next.getDay();
        if (dow !== 0 && dow !== 6) added++;
      }
      break;
    }
    default: next.setDate(next.getDate() + amount);
  }
  return next;
}

function getLocalTimeStr(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date()).replace(/^24/, "00");
}

function getLocalDayStr(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short",
  }).format(new Date());
}

function isWithinSendWindow(campaign: any): boolean {
  const tz  = campaign.timezone  || "Asia/Kolkata";
  const now  = getLocalTimeStr(tz);
  const start = campaign.startTime || "09:00";
  const end   = campaign.endTime   || "17:00";
  return now >= start && now <= end;
}

function isAllowedDay(campaign: any): boolean {
  const tz      = campaign.timezone    || "Asia/Kolkata";
  const allowed = (campaign.sendingDays || "Mon,Tue,Wed,Thu,Fri")
    .split(",").map((d: string) => d.trim());
  return allowed.includes(getLocalDayStr(tz));
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<li>/gi, "• ")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
}

function applyMergeTags(text: string, contact: any): string {
  const fullName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "";
  const tags: Record<string, string> = {
    "{{name}}": fullName, "{{firstName}}": contact.firstName || fullName.split(" ")[0] || "",
    "{{lastName}}": contact.lastName || fullName.split(" ").slice(1).join(" ") || "",
    "{{email}}": contact.email || "", "{{company}}": contact.company || "",
    "{{jobTitle}}": contact.jobTitle || "", "{{city}}": contact.city || "",
    "{{phone}}": contact.phone || "", "{{website}}": contact.website || "",
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
    secure: (settings.smtpPort || 465) === 465,
    auth: { user: "resend", pass: settings.resendKey },
  });
}

function buildFromStr(account: any | null, settings: any): string | null {
  if (account?.senderEmail)
    return account.senderName ? `"${account.senderName}" <${account.senderEmail}>` : account.senderEmail;
  if (settings.fromEmail)
    return settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
  return null;
}

// ── Progress event types ───────────────────────────────────────────────────

export interface SendProgressEvent {
  type: "start" | "sent" | "skipped" | "failed" | "done";
  total?:   number;
  count?:   number;
  sent?:    number;
  skipped?: number;
  failed?:  number;
  email?:   string;
  contact?: string;
  step?:    number;
  reason?:  string;
  errors?:  string[];
  campaignName?: string;
}

// ── Core send engine ───────────────────────────────────────────────────────

export async function runSendEngine(options: {
  campaignId?: string;
  force?: boolean;
  userId: string;
  triggeredBy?: string;
  settings: any;
  onProgress?: (event: SendProgressEvent) => void;
}): Promise<{ success: boolean; processedCount: number; skipped: number; errors: string[] }> {
  const { campaignId, force = false, userId, triggeredBy = "manual", settings, onProgress } = options;
  const emit = (e: SendProgressEvent) => onProgress?.(e);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // ── Fetch pending states ──────────────────────────────────────────────────
  let statesQuery = supabase
    .from("ContactCampaignState")
    .select(`*, contact:Contact (*)`)
    .in("status", ["New", "Contacted", "Waiting"]);

  if (campaignId) statesQuery = statesQuery.eq("campaignId", campaignId);

  const { data: allStates, error: statesErr } = await statesQuery.limit(500);
  if (statesErr) {
    return { success: false, processedCount: 0, skipped: 0, errors: [statesErr.message] };
  }

  const pendingStates = (allStates || []).filter((s) =>
    s.status === "New" ||
    (["Contacted", "Waiting"].includes(s.status) && s.nextActionDate && new Date(s.nextActionDate) <= now)
  );

  emit({ type: "start", total: pendingStates.length });

  if (pendingStates.length === 0) {
    emit({ type: "done", sent: 0, skipped: 0, failed: 0, errors: [] });
    return { success: true, processedCount: 0, skipped: 0, errors: [] };
  }

  // ── Create run log ────────────────────────────────────────────────────────
  const { data: runLog } = await supabase
    .from("CampaignRunLog")
    .insert([{ campaignId: campaignId || null, userId, triggeredBy, status: "running", logLines: [] }])
    .select()
    .single();
  const runLogId = runLog?.id;

  // ── Caches ────────────────────────────────────────────────────────────────
  const campaignCache:      Record<string, any>   = {};
  const emailAccountCache:  Record<string, any>   = {};
  const stepsCache:         Record<string, any[]> = {};
  const campaignDailyCounts: Record<string, number> = {};
  const transporterCache:   Record<string, nodemailer.Transporter> = {};

  let processedCount = 0, skipped = 0;
  const errors: string[] = [];
  const logLines: RunLogEntry[] = [];
  let runCampaignName = "";

  // ── Per-contact loop ──────────────────────────────────────────────────────
  for (const state of pendingStates) {
    const contact = state.contact;
    if (!contact?.email) { skipped++; continue; }
    if (contact.isDNC || contact.isUnsubscribed) {
      skipped++;
      emit({ type: "skipped", email: contact.email, contact: contact.name || contact.email, reason: "DNC/unsubscribed" });
      continue;
    }

    // Load campaign
    if (!campaignCache[state.campaignId]) {
      const { data: camp } = await supabase.from("Campaign").select("*").eq("id", state.campaignId).single();
      if (!camp) { skipped++; continue; }
      campaignCache[state.campaignId] = camp;
    }
    const campaign = campaignCache[state.campaignId];
    if (!runCampaignName) runCampaignName = campaign.name;

    if (!force && !isWithinSendWindow(campaign)) { skipped++; continue; }
    if (!force && !isAllowedDay(campaign))        { skipped++; continue; }

    // Daily limit
    if (!(campaign.id in campaignDailyCounts)) {
      const { count } = await supabase
        .from("EmailActivity").select("*", { count: "exact", head: true })
        .eq("campaignId", campaign.id).gte("timestamp", todayStart.toISOString());
      campaignDailyCounts[campaign.id] = count || 0;
    }
    if (campaignDailyCounts[campaign.id] >= (campaign.dailyLimit || 200)) { skipped++; continue; }

    // Email account
    if (!(campaign.id in emailAccountCache)) {
      let acct = null;
      if (campaign.emailAccountId) {
        const { data } = await supabase.from("EmailAccount").select("*").eq("id", campaign.emailAccountId).single();
        acct = data?.isActive ? data : null;
      }
      emailAccountCache[campaign.id] = acct;
    }
    const account = emailAccountCache[campaign.id];

    if (!account && !settings.resendKey) {
      errors.push(`"${campaign.name}": no email account or API key.`);
      skipped++;
      continue;
    }
    const fromStr = buildFromStr(account, settings);
    if (!fromStr) {
      errors.push(`"${campaign.name}": no sender email — link an Email Account.`);
      skipped++;
      continue;
    }

    // Steps
    if (!stepsCache[campaign.id]) {
      const { data: steps } = await supabase
        .from("CampaignStep").select(`*, template:Template(*)`)
        .eq("campaignId", campaign.id).order("stepNumber", { ascending: true });
      stepsCache[campaign.id] = steps || [];
    }
    const steps = stepsCache[campaign.id];
    const currentStepNumber = state.currentStep ?? 0;
    const currentStep = steps.find((s) => s.stepNumber === currentStepNumber);
    const nextStep    = steps.find((s) => s.stepNumber === currentStepNumber + 1);

    if (!currentStep?.template) {
      errors.push(`"${campaign.name}": step ${currentStepNumber} has no template.`);
      skipped++;
      continue;
    }

    // Transporter
    if (!transporterCache[campaign.id]) {
      transporterCache[campaign.id] = buildTransporter(account, settings);
    }
    const transporter = transporterCache[campaign.id];
    const replyToStr  = account?.replyTo || settings.replyTo || undefined;

    // Compose
    const template = currentStep.template;
    const subject  = applyMergeTags(template.subject || "", contact);
    let   body     = applyMergeTags(template.body    || "", contact);
    if (template.signature) body += `\n\n${template.signature}`;
    const isHtml   = /<[a-z][\s\S]*>/i.test(body);
    const htmlBody = isHtml ? body : body.replace(/\n/g, "<br />");
    const plainBody = isHtml ? htmlToText(body) : body;

    const sentAt = new Date().toISOString();

    try {
      await transporter.sendMail({
        from: fromStr, to: contact.email, replyTo: replyToStr, subject,
        html: htmlBody, text: plainBody,
        headers: { "X-Mailer": "YESPFLOW", "Precedence": "bulk" },
        attachments: (template.attachments || []).map((a: any) => ({ filename: a.name, href: a.url })),
      });

      await supabase.from("EmailActivity").insert([{
        contactId: state.contactId, campaignId: campaign.id, userId,
        type: `Step ${currentStepNumber + 1}: ${template.name}`,
      }]);

      if (nextStep) {
        const nextDate = calculateNextDate(nextStep.delayDays || 1, nextStep.delayUnit || "days");
        await supabase.from("ContactCampaignState").update({
          currentStep: currentStepNumber + 1, status: "Waiting",
          lastSent: now.toISOString(), nextActionDate: nextDate.toISOString(),
        }).eq("id", state.id);
      } else {
        await supabase.from("ContactCampaignState").update({
          status: "Completed", lastSent: now.toISOString(), nextActionDate: null,
        }).eq("id", state.id);
      }

      campaignDailyCounts[campaign.id]++;
      processedCount++;

      const entry: RunLogEntry = {
        email: contact.email, contact: contact.name || contact.email,
        campaign: campaign.name, step: currentStepNumber + 1,
        status: "sent", timestamp: sentAt,
      };
      logLines.push(entry);

      // Update run log progress
      if (runLogId) {
        await supabase.from("CampaignRunLog").update({ totalSent: processedCount }).eq("id", runLogId);
      }

      emit({ type: "sent", count: processedCount, email: contact.email, contact: contact.name || contact.email, step: currentStepNumber + 1 });
    } catch (err: any) {
      const msg = err?.message ?? "Unknown send error";
      errors.push(`${contact.email}: ${msg}`);
      await supabase.from("ContactCampaignState").update({ status: "Bounced", stoppedReason: msg }).eq("id", state.id);

      logLines.push({
        email: contact.email, contact: contact.name || contact.email,
        campaign: campaign.name, step: currentStepNumber + 1,
        status: "failed", timestamp: new Date().toISOString(), note: msg,
      });

      if (runLogId) {
        await supabase.from("CampaignRunLog").update({ totalFailed: errors.length }).eq("id", runLogId);
      }

      emit({ type: "failed", email: contact.email, contact: contact.name || contact.email, reason: msg });
    }
  }

  // ── Finalise run log ──────────────────────────────────────────────────────
  const completedAt = new Date().toISOString();
  if (runLogId) {
    await supabase.from("CampaignRunLog").update({
      status: "completed", completedAt,
      totalSent: processedCount, totalSkipped: skipped, totalFailed: errors.length,
      logLines,
    }).eq("id", runLogId);
  }

  emit({ type: "done", sent: processedCount, skipped, failed: errors.length, errors, campaignName: runCampaignName });

  // ── Generate & email PDF report ───────────────────────────────────────────
  if (settings.reportingEmail && logLines.length > 0) {
    try {
      const summary: RunSummary = {
        campaignName: runCampaignName || "Campaign",
        startedAt: now.toLocaleString(), completedAt: new Date(completedAt).toLocaleString(),
        totalSent: processedCount, totalSkipped: skipped, totalFailed: errors.length,
        entries: logLines,
      };
      const pdfBuf = await generateRunReportPDF(summary);
      const reportTransporter = buildTransporter(null, settings);
      const fromStr2 = buildFromStr(null, settings) || settings.reportingEmail;
      if (fromStr2) {
        await reportTransporter.sendMail({
          from: fromStr2, to: settings.reportingEmail,
          subject: `YESP Flow Report: ${summary.campaignName} — ${processedCount} sent`,
          text: `Campaign run complete.\n\nSent: ${processedCount}\nSkipped: ${skipped}\nFailed: ${errors.length}\n\nSee attached PDF for full log.`,
          attachments: [{
            filename: `yesp-flow-report-${Date.now()}.pdf`,
            content: pdfBuf, contentType: "application/pdf",
          }],
        });
        if (runLogId) {
          await supabase.from("CampaignRunLog").update({ reportSent: true }).eq("id", runLogId);
        }
      }
    } catch (pdfErr: any) {
      console.error("[send-engine] PDF report failed:", pdfErr.message);
    }
  }

  return { success: true, processedCount, skipped, errors };
}
