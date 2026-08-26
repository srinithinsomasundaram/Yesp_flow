-- ============================================================
-- Migration v2: Per-user data isolation
-- Run this in your Supabase SQL editor
-- ============================================================

-- Add userId column to all main tables
ALTER TABLE "Contact"      ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Campaign"     ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Template"     ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "EmailAccount" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "FileLibrary"  ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Fix Contact unique constraint: was per-email globally,
-- now must be per (email, userId) so different users can share contacts
ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_email_key";
ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_email_userId_unique";
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_email_userId_unique"
  UNIQUE ("email", "userId");

-- Settings: allow one row per user (id = userId)
-- No schema change needed — just use userId as the id value in code
