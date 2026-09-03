-- ============================================================
-- Migration v5: Resend email tracking (delivery, open, click, bounce)
-- Run this in your Supabase SQL editor
-- ============================================================

-- Store the Resend email ID so webhook events can update the row
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "resendEmailId" TEXT;

-- Current delivery status (sent → delivered → opened → clicked / bounced / complained)
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "resendStatus" TEXT DEFAULT 'sent';

-- Event timestamps
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "deliveredAt"  TIMESTAMP WITH TIME ZONE;
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "openedAt"     TIMESTAMP WITH TIME ZONE;
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "clickedAt"    TIMESTAMP WITH TIME ZONE;
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "bouncedAt"    TIMESTAMP WITH TIME ZONE;
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "complainedAt" TIMESTAMP WITH TIME ZONE;

-- Index for fast webhook lookups by email ID
CREATE INDEX IF NOT EXISTS "EmailActivity_resendEmailId_idx"
  ON "EmailActivity" ("resendEmailId");
