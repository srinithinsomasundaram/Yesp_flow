import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Resend calls this endpoint for every delivery event.
// Set RESEND_WEBHOOK_SECRET in your env and pass it via the Authorization header
// in the Resend dashboard webhook settings: Authorization: Bearer <secret>
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: true });

  const { type, data } = payload as { type: string; data: Record<string, any> };
  const emailId: string | undefined = data?.email_id;
  if (!emailId || !type) return NextResponse.json({ ok: true });

  const now = new Date().toISOString();

  // Build the status update
  const updates: Record<string, any> = {};

  switch (type) {
    case "email.sent":
      updates.resendStatus = "sent";
      break;
    case "email.delivered":
      updates.resendStatus = "delivered";
      updates.deliveredAt  = data.created_at ?? now;
      break;
    case "email.delivery_delayed":
      updates.resendStatus = "delayed";
      break;
    case "email.opened":
      updates.resendStatus = "opened";
      updates.openedAt     = data.created_at ?? now;
      break;
    case "email.clicked":
      updates.resendStatus = "clicked";
      updates.clickedAt    = data.created_at ?? now;
      break;
    case "email.bounced":
      updates.resendStatus = "bounced";
      updates.bouncedAt    = data.created_at ?? now;
      break;
    case "email.complained":
      updates.resendStatus = "complained";
      updates.complainedAt = data.created_at ?? now;
      break;
    default:
      return NextResponse.json({ ok: true });
  }

  // Update the EmailActivity row
  await supabase.from("EmailActivity").update(updates).eq("resendEmailId", emailId);

  // On bounce: mark contact as bounced and stop their campaign sequence
  if (type === "email.bounced") {
    const { data: activity } = await supabase
      .from("EmailActivity")
      .select("contactId, campaignId")
      .eq("resendEmailId", emailId)
      .maybeSingle();

    if (activity?.contactId) {
      await supabase
        .from("Contact")
        .update({ isBounced: true })
        .eq("id", activity.contactId);

      if (activity.campaignId) {
        await supabase
          .from("ContactCampaignState")
          .update({ status: "Bounced", stoppedReason: "Hard bounce reported by Resend" })
          .eq("contactId", activity.contactId)
          .eq("campaignId", activity.campaignId);
      }
    }
  }

  // On spam complaint: unsubscribe the contact
  if (type === "email.complained") {
    const { data: activity } = await supabase
      .from("EmailActivity")
      .select("contactId")
      .eq("resendEmailId", emailId)
      .maybeSingle();

    if (activity?.contactId) {
      await supabase
        .from("Contact")
        .update({ isUnsubscribed: true })
        .eq("id", activity.contactId);
    }
  }

  return NextResponse.json({ ok: true });
}
