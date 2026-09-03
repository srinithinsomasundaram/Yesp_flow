-- IMAP reply-detection fields for EmailAccount
-- Run this in your Supabase SQL editor

ALTER TABLE "EmailAccount"
  ADD COLUMN IF NOT EXISTS "imapHost"    TEXT,
  ADD COLUMN IF NOT EXISTS "imapPort"    INTEGER DEFAULT 993,
  ADD COLUMN IF NOT EXISTS "imapEnabled" BOOLEAN DEFAULT FALSE;

-- Add reply_received as a recognised activity type (no schema change needed,
-- type is a free-text column — this is just documentation)
-- EmailActivity.type = 'reply_received' will be written by the IMAP worker
