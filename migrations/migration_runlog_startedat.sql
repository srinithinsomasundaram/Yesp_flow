-- Add startedAt to CampaignRunLog if it doesn't exist yet,
-- then backfill existing rows from completedAt (or NOW() as fallback).
-- Run this in your Supabase SQL editor.

ALTER TABLE "CampaignRunLog"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE "CampaignRunLog"
  SET "startedAt" = COALESCE("completedAt", NOW())
  WHERE "startedAt" IS NULL;
