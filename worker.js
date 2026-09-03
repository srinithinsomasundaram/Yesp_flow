const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");
global.WebSocket = ws;

require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service-role key so the worker can read all campaigns without RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Worker: Missing Supabase credentials — background jobs disabled.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── IMAP reply detection ───────────────────────────────────────────────────────
let ImapFlow;
try {
  ImapFlow = require("imapflow").ImapFlow;
} catch {
  console.warn("[Worker] imapflow not found — IMAP reply detection disabled.");
}

async function checkAccountForReplies(account) {
  if (!ImapFlow) return;

  const imapHost = account.imapHost || account.smtpHost?.replace(/^smtp\./i, "imap.");
  const client = new ImapFlow({
    host: imapHost,
    port: account.imapPort || 993,
    secure: true,
    auth: { user: account.smtpUser, pass: account.smtpPass },
    logger: false,
  });

  try {
    await client.connect();
  } catch (err) {
    console.error(`[IMAP] Connect failed for ${account.senderEmail}: ${err.message}`);
    return;
  }

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Look for emails received in the last 48 hours
      const since = new Date();
      since.setHours(since.getHours() - 48);

      const uids = await client.search({ since }, { uid: true });
      if (!uids || uids.length === 0) return;

      // Fetch envelopes for all matching messages
      for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
        const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase().trim();
        if (!fromAddr) continue;

        // Find a contact with this email that has a Contacted/Waiting state
        // for a campaign belonging to this email account
        const { data: states } = await supabase
          .from("ContactCampaignState")
          .select("id, contactId, campaignId, status")
          .in("status", ["New", "Contacted", "Waiting"])
          .eq("campaign.emailAccountId", account.id)   // PostgREST FK filter
          .limit(5);

        // Fallback: get contact by email then filter states
        const { data: contact } = await supabase
          .from("Contact")
          .select("id, userId, status")
          .eq("email", fromAddr)
          .eq("userId", account.userId)
          .maybeSingle();

        if (!contact) continue;

        // Get active campaign states for this contact under this email account's campaigns
        const { data: activeCampaigns } = await supabase
          .from("Campaign")
          .select("id")
          .eq("emailAccountId", account.id)
          .eq("userId", account.userId);

        if (!activeCampaigns?.length) continue;
        const campaignIds = activeCampaigns.map((c) => c.id);

        const { data: activeStates } = await supabase
          .from("ContactCampaignState")
          .select("id, campaignId, status")
          .eq("contactId", contact.id)
          .in("campaignId", campaignIds)
          .in("status", ["New", "Contacted", "Waiting"]);

        if (!activeStates?.length) continue;

        for (const state of activeStates) {
          const repliedAt = msg.envelope.date?.toISOString() || new Date().toISOString();

          await supabase
            .from("ContactCampaignState")
            .update({
              status: "Replied",
              repliedAt,
              replyNote: "Auto-detected via IMAP inbox",
              nextActionDate: null,
            })
            .eq("id", state.id);

          // Log as EmailActivity
          await supabase.from("EmailActivity").insert({
            userId: account.userId,
            contactId: contact.id,
            campaignId: state.campaignId,
            type: "reply_received",
            timestamp: repliedAt,
            resendStatus: "replied",
          });

          console.log(`[IMAP] ✓ Reply auto-detected: ${fromAddr} → campaign ${state.campaignId}`);
        }

        // Update the contact's top-level status
        if (activeStates.length > 0) {
          await supabase
            .from("Contact")
            .update({ status: "Replied" })
            .eq("id", contact.id)
            .eq("userId", account.userId);
        }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error(`[IMAP] Error reading inbox for ${account.senderEmail}: ${err.message}`);
  } finally {
    await client.logout();
  }
}

async function checkAllImapAccounts() {
  if (!ImapFlow) return;

  // Only pull accounts that have a userId — orphaned rows are skipped
  const { data: accounts } = await supabase
    .from("EmailAccount")
    .select("id, userId, senderEmail, smtpUser, smtpPass, smtpHost, imapHost, imapPort")
    .eq("imapEnabled", true)
    .eq("isActive", true)
    .not("userId", "is", null);

  if (!accounts?.length) return;

  console.log(`[IMAP] Checking ${accounts.length} account(s) for replies…`);
  for (const account of accounts) {
    if (!account.userId) continue; // defensive: never process account without owner
    await checkAccountForReplies(account).catch((err) =>
      console.error(`[IMAP] Unhandled error for ${account.senderEmail}:`, err.message)
    );
  }
}

async function checkAndRunCron() {
  try {
    const { data: campaigns, error } = await supabase
      .from("Campaign")
      .select("id, name, cronTime, cronEnabled, timezone, userId")
      .eq("status", "active")
      .eq("cronEnabled", true)
      .not("userId", "is", null);

    if (error || !campaigns || campaigns.length === 0) {
      return;
    }

    const now = new Date();

    // Today's boundary in UTC for DB comparison
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    for (const campaign of campaigns) {
      // Compare cronTime in the campaign's own timezone, not the server's local clock
      const tz = campaign.timezone || "Asia/Kolkata";
      const localTimeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(now).replace(/^24/, "00");

      if (campaign.cronTime !== localTimeStr) continue;

      // Check the DB for a run log entry today so restarts don't double-fire.
      const { count } = await supabase
        .from("CampaignRunLog")
        .select("id", { count: "exact", head: true })
        .eq("campaignId", campaign.id)
        .gte("startedAt", todayStart.toISOString());

      if (count > 0) {
        console.log(`[Worker] Campaign "${campaign.name}" already ran today — skipping.`);
        continue;
      }

      console.log(`[Worker] Triggering automated emails for Campaign: ${campaign.name} (${campaign.cronTime})...`);

      try {
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
          console.error(`[Worker] CRON_SECRET is not set — cannot authenticate cron request. Set CRON_SECRET in your env.`);
          continue;
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${appUrl}/api/cron?campaignId=${campaign.id}`, {
          headers: { authorization: `Bearer ${cronSecret}` },
        });
        const result = await res.json();

        if (result.success) {
          console.log(`[Worker] Campaign "${campaign.name}" run complete.`);
        } else {
          console.error(`[Worker] Campaign "${campaign.name}" failed:`, result.error);
        }
      } catch (err) {
        console.error(`[Worker] Campaign "${campaign.name}" network error:`, err.message);
      }
    }
  } catch (err) {
    console.error("[Worker] Error:", err.message);
  }
}

console.log("=========================================");
console.log("  Automated Background Worker Started");
console.log("  Cron: every minute | IMAP replies: every 5 min");
console.log("=========================================");

// Campaign cron — every minute
setInterval(checkAndRunCron, 60 * 1000);
checkAndRunCron();

// IMAP reply detection — every 5 minutes
setInterval(checkAllImapAccounts, 5 * 60 * 1000);
// Run once after 30s on boot (give app time to start)
setTimeout(checkAllImapAccounts, 30 * 1000);
