-- ============================================================
-- Migration v3: Teams RBAC, Campaign Run Logs, Reporting Email
-- Run this in your Supabase SQL editor
-- ============================================================

-- Settings: add reporting / sender fields
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "reportingEmail" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "fromName"       TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "fromEmail"      TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "replyTo"        TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "smtpHost"       TEXT DEFAULT 'smtp.resend.com';
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "smtpPort"       INTEGER DEFAULT 465;

-- Teams
CREATE TABLE IF NOT EXISTS "Team" (
  "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name"      TEXT NOT NULL,
  "ownerId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "Team" DISABLE ROW LEVEL SECURITY;

-- Team Members
CREATE TABLE IF NOT EXISTS "TeamMember" (
  "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "teamId"      UUID NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
  "userId"      TEXT,
  "email"       TEXT NOT NULL,
  "role"        TEXT NOT NULL DEFAULT 'member',  -- owner | admin | member | viewer
  "status"      TEXT NOT NULL DEFAULT 'invited', -- invited | active
  "inviteToken" TEXT,
  "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("teamId", "email")
);
ALTER TABLE "TeamMember" DISABLE ROW LEVEL SECURITY;

-- Campaign Run Logs
CREATE TABLE IF NOT EXISTS "CampaignRunLog" (
  "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "campaignId"   UUID NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "userId"       TEXT,
  "triggeredBy"  TEXT DEFAULT 'manual',  -- manual | cron | worker
  "status"       TEXT DEFAULT 'running', -- running | completed | failed
  "startedAt"    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt"  TIMESTAMP WITH TIME ZONE,
  "totalSent"    INTEGER DEFAULT 0,
  "totalSkipped" INTEGER DEFAULT 0,
  "totalFailed"  INTEGER DEFAULT 0,
  "logLines"     JSONB DEFAULT '[]',
  "reportSent"   BOOLEAN DEFAULT FALSE
);
ALTER TABLE "CampaignRunLog" DISABLE ROW LEVEL SECURITY;
