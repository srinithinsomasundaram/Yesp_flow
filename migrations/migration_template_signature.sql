-- Migration: Ensure signature column exists on Template
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "signature" TEXT;
