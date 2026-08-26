export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { runSendEngine, SendProgressEvent } from "@/lib/send-engine";
import { getSettings } from "@/actions/settings";

export async function POST(request: Request) {
  // Auth check
  const serverSupabase = await createSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { campaignId, force = true } = body as { campaignId?: string; force?: boolean };

  const settings = await getSettings();
  const encoder  = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SendProgressEvent) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {}
      }

      try {
        await runSendEngine({
          campaignId, force, userId: user.id,
          triggeredBy: "manual", settings,
          onProgress: send,
        });
      } catch (err: any) {
        send({ type: "done", sent: 0, skipped: 0, failed: 0, errors: [err.message] });
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
