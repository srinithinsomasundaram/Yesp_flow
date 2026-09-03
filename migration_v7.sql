-- ============================================================
-- Migration v7: Security hardening
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── Add userId foreign keys (if not already present) ─────────────────────

-- EmailAccount needs a userId so RLS can scope rows per workspace owner.
ALTER TABLE "EmailAccount" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: if you have existing rows without a userId you must populate them
-- manually before enabling RLS, e.g.:
--   UPDATE "EmailAccount" SET "userId" = '<your-user-id>' WHERE "userId" IS NULL;

-- FileLibrary userId (column already used in app code — ensure it exists).
ALTER TABLE "FileLibrary" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE "EmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileLibrary"  ENABLE ROW LEVEL SECURITY;

-- ── Policies: EmailAccount ────────────────────────────────────────────────

-- Service-role key (used by server actions) bypasses RLS automatically.
-- These policies protect direct anon/authenticated API access.

CREATE POLICY "emailaccount_select_own" ON "EmailAccount"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "emailaccount_insert_own" ON "EmailAccount"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "emailaccount_update_own" ON "EmailAccount"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "emailaccount_delete_own" ON "EmailAccount"
  FOR DELETE USING (auth.uid() = "userId");

-- ── Policies: FileLibrary ─────────────────────────────────────────────────

CREATE POLICY "filelibrary_select_own" ON "FileLibrary"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "filelibrary_insert_own" ON "FileLibrary"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "filelibrary_update_own" ON "FileLibrary"
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "filelibrary_delete_own" ON "FileLibrary"
  FOR DELETE USING (auth.uid() = "userId");

-- ── Index for per-user lookups ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "EmailAccount_userId_idx" ON "EmailAccount" ("userId");
CREATE INDEX IF NOT EXISTS "FileLibrary_userId_idx"  ON "FileLibrary"  ("userId");

-- ── Index for ContactCampaignState status queries (used by send engine) ──
CREATE INDEX IF NOT EXISTS "ContactCampaignState_status_idx"
  ON "ContactCampaignState" ("status");

CREATE INDEX IF NOT EXISTS "ContactCampaignState_nextActionDate_idx"
  ON "ContactCampaignState" ("nextActionDate");
