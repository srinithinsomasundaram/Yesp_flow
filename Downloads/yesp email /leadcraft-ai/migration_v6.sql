-- ============================================================
-- Migration v6: Unsubscribe tokens, Tags, LinkedIn, Webhook-out
-- Run this in your Supabase SQL editor
-- ============================================================

-- Unsubscribe token for each contact (used in email footer links)
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;
UPDATE "Contact" SET "unsubscribeToken" = gen_random_uuid()::text WHERE "unsubscribeToken" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_unsubscribeToken_idx" ON "Contact" ("unsubscribeToken");

-- Contact tags (array of strings, e.g. ['SaaS','Chennai','Q1'])
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';

-- LinkedIn profile URL
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;

-- Outgoing webhook URL — notified after each email sent / bounced / replied
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "webhookOutUrl" TEXT;
