import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runSendEngine } from "@/lib/send-engine";

export async function GET(request: Request) {
  // Fail closed: CRON_SECRET must be configured and must match. No secret = no access.
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId") ?? undefined;
    const now = new Date();

    // ── Per-campaign mode (used by the local worker) ───────────────────────
    if (campaignId) {
      const { data: campaign } = await supabase
        .from("Campaign")
        .select("userId")
        .eq("id", campaignId)
        .single();
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }
      const { data: settings } = await supabase
        .from("Settings")
        .select("*")
        .eq("id", campaign.userId)
        .maybeSingle();

      const result = await runSendEngine({
        campaignId,
        userId: campaign.userId,
        force: false,
        triggeredBy: "cron",
        settings: settings ?? {},
      });
      return NextResponse.json({ success: true, ran: 1, results: [result] });
    }

    // ── Global automation mode (Vercel cron / external scheduler) ─────────
    const { data: allSettings, error } = await supabase
      .from("Settings")
      .select("*")
      .eq("automationEnabled", true);

    if (error) throw error;
    if (!allSettings?.length) {
      return NextResponse.json({ success: true, ran: 0, message: "No users with automation enabled." });
    }

    let ran = 0;
    const results: Record<string, any>[] = [];

    for (const settings of allSettings) {
      const userId       = settings.id as string;
      const intervalMins = settings.automationIntervalMins ?? 60;
      const lastRun      = settings.lastAutomationRun ? new Date(settings.lastAutomationRun) : null;

      if (lastRun) {
        const elapsedMins = (now.getTime() - lastRun.getTime()) / 60_000;
        if (elapsedMins < intervalMins) {
          results.push({ userId, skipped: true, reason: `Next run in ${Math.ceil(intervalMins - elapsedMins)}m` });
          continue;
        }
      }

      // Stamp immediately to prevent double-triggers on concurrent invocations
      await supabase
        .from("Settings")
        .update({ lastAutomationRun: now.toISOString() })
        .eq("id", userId);

      const result = await runSendEngine({ userId, force: false, triggeredBy: "cron", settings });
      ran++;
      results.push({ userId, ...result });
    }

    return NextResponse.json({ success: true, ran, results });
  } catch (err: any) {
    console.error("[cron] error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
