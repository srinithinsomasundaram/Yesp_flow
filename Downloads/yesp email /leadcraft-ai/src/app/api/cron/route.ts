import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runSendEngine } from "@/lib/send-engine";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Find all users who have automation enabled
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
      const userId      = settings.id as string;
      const intervalMins = settings.automationIntervalMins ?? 60;
      const lastRun     = settings.lastAutomationRun ? new Date(settings.lastAutomationRun) : null;

      // Skip if the interval hasn't elapsed yet
      if (lastRun) {
        const elapsedMins = (now.getTime() - lastRun.getTime()) / 60_000;
        if (elapsedMins < intervalMins) {
          results.push({
            userId,
            skipped: true,
            reason: `Next run in ${Math.ceil(intervalMins - elapsedMins)}m`,
          });
          continue;
        }
      }

      // Stamp the run time immediately to prevent double-triggers on concurrent invocations
      await supabase
        .from("Settings")
        .update({ lastAutomationRun: now.toISOString() })
        .eq("id", userId);

      const result = await runSendEngine({
        userId,
        force: false,
        triggeredBy: "cron",
        settings,
      });

      ran++;
      results.push({ userId, ...result });
    }

    return NextResponse.json({ success: true, ran, results });
  } catch (err: any) {
    console.error("[cron] error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
