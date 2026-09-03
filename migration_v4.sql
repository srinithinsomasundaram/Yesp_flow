-- ============================================================
-- Migration v4: Configurable Automation Schedule
-- Run this in your Supabase SQL editor
-- ============================================================

-- Automation on/off toggle (default: enabled)
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "automationEnabled"      BOOLEAN           DEFAULT TRUE;

-- How often the automation runs in minutes (default: every 60 min)
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "automationIntervalMins" INTEGER           DEFAULT 60;

-- Timestamp of the last successful automation run per user
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "lastAutomationRun"      TIMESTAMP WITH TIME ZONE;
