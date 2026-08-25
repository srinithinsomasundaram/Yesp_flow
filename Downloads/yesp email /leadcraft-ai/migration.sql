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
  "storagePath" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "FileLibrary" DISABLE ROW LEVEL SECURITY;

-- Add storagePath to existing FileLibrary table (if table already exists)
ALTER TABLE "FileLibrary" ADD COLUMN IF NOT EXISTS "storagePath" TEXT;

-- Attachments on templates (array of {id, name, url} stored as JSONB)
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "attachments" JSONB DEFAULT '[]';

-- Add campaignId to EmailActivity for per-campaign daily-limit tracking
ALTER TABLE "EmailActivity" ADD COLUMN IF NOT EXISTS "campaignId" UUID REFERENCES "Campaign"("id") ON DELETE SET NULL;

-- Index for fast daily-limit queries (campaign + timestamp range)
CREATE INDEX IF NOT EXISTS "EmailActivity_campaignId_timestamp_idx"
  ON "EmailActivity" ("campaignId", "timestamp");
