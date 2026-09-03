-- TLS mode per SMTP email account
-- Run this in your Supabase SQL editor

ALTER TABLE "EmailAccount"
  ADD COLUMN IF NOT EXISTS "tlsMode" TEXT DEFAULT 'opportunistic';

-- tlsMode values:
--   'opportunistic' (default) — tries TLS, falls back to plaintext if server can't do it
--   'enforced'                 — connection must use TLS; fails if server doesn't support it
