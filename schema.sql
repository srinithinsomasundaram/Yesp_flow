-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Contacts
CREATE TABLE "Contact" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "company" TEXT,
  "tags" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campaigns
CREATE TABLE "Campaign" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "dailyLimit" INTEGER DEFAULT 200,
  "pacingSeconds" INTEGER DEFAULT 30,
  "cronTime" TEXT DEFAULT '09:00',
  "cronEnabled" BOOLEAN DEFAULT false,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Templates
CREATE TABLE "Template" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "signature" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Campaign Steps
CREATE TABLE "CampaignStep" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "campaignId" UUID NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "stepNumber" INTEGER NOT NULL,
  "templateId" UUID NOT NULL REFERENCES "Template"("id") ON DELETE RESTRICT,
  "delayDays" INTEGER DEFAULT 0
);

-- 5. Contact Campaign States
CREATE TABLE "ContactCampaignState" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "contactId" UUID NOT NULL REFERENCES "Contact"("id") ON DELETE CASCADE,
  "campaignId" UUID NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "currentStep" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'New',
  "lastSent" TIMESTAMP WITH TIME ZONE,
  "nextActionDate" TIMESTAMP WITH TIME ZONE,
  UNIQUE("contactId", "campaignId")
);

-- 6. Email Activity
CREATE TABLE "EmailActivity" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "contactId" UUID NOT NULL REFERENCES "Contact"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Settings
CREATE TABLE "Settings" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "resendKey" TEXT,
  "fromName" TEXT,
  "fromEmail" TEXT,
  "replyTo" TEXT,
  "smtpHost" TEXT DEFAULT 'smtp.resend.com',
  "smtpPort" INTEGER DEFAULT 465,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on all tables for local MVP development
ALTER TABLE "Contact" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignStep" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactCampaignState" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailActivity" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" DISABLE ROW LEVEL SECURITY;

-- ========================
-- Migration v1.1 additions
-- ========================

-- Expand Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'New';
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isUnsubscribed" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isBounced" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isDNC" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "customFields" JSONB DEFAULT '{}';

-- Expand Template
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'Custom';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "replyTo" TEXT;

-- Expand Campaign
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "sendingDays" TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "startTime" TEXT DEFAULT '09:00';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "endTime" TEXT DEFAULT '17:00';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "emailAccountId" UUID;

-- Expand CampaignStep
ALTER TABLE "CampaignStep" ADD COLUMN IF NOT EXISTS "delayUnit" TEXT DEFAULT 'days';

-- Expand ContactCampaignState
ALTER TABLE "ContactCampaignState" ADD COLUMN IF NOT EXISTS "stoppedReason" TEXT;

-- Email Accounts table
CREATE TABLE IF NOT EXISTS "EmailAccount" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "label" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'smtp',
  "smtpHost" TEXT DEFAULT 'smtp.resend.com',
  "smtpPort" INTEGER DEFAULT 465,
  "smtpUser" TEXT DEFAULT 'resend',
  "smtpPass" TEXT,
  "resendApiKey" TEXT,
  "dailyLimit" INTEGER DEFAULT 50,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "EmailAccount" DISABLE ROW LEVEL SECURITY;

-- File Library table
CREATE TABLE IF NOT EXISTS "FileLibrary" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "size" INTEGER,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "FileLibrary" DISABLE ROW LEVEL SECURITY;
