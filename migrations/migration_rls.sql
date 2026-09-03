-- ============================================================
-- Enable Row Level Security on all core tables
-- Run in Supabase SQL editor
-- ============================================================

-- Contact
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_owner" ON "Contact";
CREATE POLICY "contact_owner" ON "Contact"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- Campaign
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_owner" ON "Campaign";
CREATE POLICY "campaign_owner" ON "Campaign"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- Template
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "template_owner" ON "Template";
CREATE POLICY "template_owner" ON "Template"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- CampaignStep (scoped via campaign ownership)
ALTER TABLE "CampaignStep" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "step_owner" ON "CampaignStep";
CREATE POLICY "step_owner" ON "CampaignStep"
  USING (
    EXISTS (
      SELECT 1 FROM "Campaign"
      WHERE "Campaign"."id" = "CampaignStep"."campaignId"
        AND "Campaign"."userId" = auth.uid()::text
    )
  );

-- ContactCampaignState (scoped via campaign ownership)
ALTER TABLE "ContactCampaignState" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ccs_owner" ON "ContactCampaignState";
CREATE POLICY "ccs_owner" ON "ContactCampaignState"
  USING (
    EXISTS (
      SELECT 1 FROM "Campaign"
      WHERE "Campaign"."id" = "ContactCampaignState"."campaignId"
        AND "Campaign"."userId" = auth.uid()::text
    )
  );

-- EmailActivity
ALTER TABLE "EmailActivity" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_owner" ON "EmailActivity";
CREATE POLICY "activity_owner" ON "EmailActivity"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- Settings
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_owner" ON "Settings";
CREATE POLICY "settings_owner" ON "Settings"
  USING ("id" = auth.uid()::text)
  WITH CHECK ("id" = auth.uid()::text);

-- EmailAccount
ALTER TABLE "EmailAccount" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emailaccount_owner" ON "EmailAccount";
CREATE POLICY "emailaccount_owner" ON "EmailAccount"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- FileLibrary
ALTER TABLE "FileLibrary" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "file_owner" ON "FileLibrary";
CREATE POLICY "file_owner" ON "FileLibrary"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- CampaignRunLog
ALTER TABLE "CampaignRunLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "runlog_owner" ON "CampaignRunLog";
CREATE POLICY "runlog_owner" ON "CampaignRunLog"
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================
-- IMPORTANT: The app uses a service-role key in the worker and
-- server actions (supabase admin client) which bypasses RLS.
-- The anon/session client used in browser routes still respects
-- these policies. That is the correct split.
-- ============================================================
