const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");
global.WebSocket = ws;

require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map of campaignId -> date string to track executions
const lastRunDates = {};

async function checkAndRunCron() {
  try {
    const { data: campaigns, error } = await supabase
      .from("Campaign")
      .select("id, name, cronTime, cronEnabled")
      .eq("status", "active")
      .eq("cronEnabled", true);

    if (error || !campaigns || campaigns.length === 0) {
      return; // No active campaigns with cron enabled
    }

    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = now.toDateString();

    for (const campaign of campaigns) {
      if (campaign.cronTime === currentTimeStr && lastRunDates[campaign.id] !== todayStr) {
        console.log(`[Worker] Triggering automated emails for Campaign: ${campaign.name} (${campaign.cronTime})...`);
        
        try {
          const cronSecret = process.env.CRON_SECRET;
          const headers = cronSecret ? { authorization: `Bearer ${cronSecret}` } : {};
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const res = await fetch(`${appUrl}/api/cron?campaignId=${campaign.id}`, { headers });
          const result = await res.json();
          
          if (result.success) {
            lastRunDates[campaign.id] = todayStr; // ensure it only runs once per day per campaign
            console.log(`[Worker] Campaign "${campaign.name}" processed ${result.processedCount} actions.`);
          } else {
            console.error(`[Worker] Campaign "${campaign.name}" failed:`, result.error);
          }
        } catch (err) {
          console.error(`[Worker] Campaign "${campaign.name}" network error:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[Worker] Error:", err.message);
  }
}

console.log("=========================================");
console.log("  Automated Background Worker Started");
console.log("  Checking per-campaign schedules every minute...");
console.log("=========================================");

// Check every minute
setInterval(checkAndRunCron, 60 * 1000);

// Initial check on boot
checkAndRunCron();
