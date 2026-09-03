export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { generateRunReportPDF } from "@/lib/pdf-report";
import type { RunSummary } from "@/lib/pdf-report";

export async function GET(request: Request) {
  const serverSupabase = await createSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const { data: log } = await supabase
    .from("CampaignRunLog")
    .select("startedAt, completedAt, totalSent, totalSkipped, totalFailed, logLines, campaign:Campaign(name)")
    .eq("id", runId)
    .eq("userId", user.id)
    .single();

  if (!log) return NextResponse.json({ error: "Run log not found" }, { status: 404 });

  const summary: RunSummary = {
    campaignName: (log.campaign as unknown as { name: string } | null)?.name || "Campaign",
    startedAt: new Date(log.startedAt as string).toLocaleString(),
    completedAt: log.completedAt
      ? new Date(log.completedAt).toLocaleString()
      : new Date().toLocaleString(),
    totalSent: log.totalSent || 0,
    totalSkipped: log.totalSkipped || 0,
    totalFailed: log.totalFailed || 0,
    entries: log.logLines || [],
  };

  try {
    const pdfBuf = await generateRunReportPDF(summary);
    const filename = `yesp-flow-report-${runId.slice(0, 8)}.pdf`;

    return new Response(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err: unknown) {
    console.error("[report] PDF generation failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
