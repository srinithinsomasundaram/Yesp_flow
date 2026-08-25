import { NextResponse } from "next/server";
import { triggerFollowUps } from "@/actions/dashboard";

export async function GET(request: Request) {
  // Require CRON_SECRET so this endpoint cannot be triggered by anyone on the internet
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const result = await triggerFollowUps(campaignId || undefined);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[cron] error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
