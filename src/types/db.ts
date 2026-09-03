// Shared database row types — generated shapes mirror the Supabase schema.
// Use these instead of `any` for contact, activity, and campaign state queries.

export type CampaignStateStatus =
  | "New"
  | "Contacted"
  | "Waiting"
  | "Replied"
  | "Completed"
  | "Bounced"
  | "Unsubscribed";

export interface ContactCampaignState {
  id: string;
  contactId: string;
  campaignId: string;
  status: CampaignStateStatus;
  currentStep: number;
  nextActionDate: string | null;
  lastSent: string | null;
  repliedAt: string | null;
  replyNote: string | null;
  stoppedReason: string | null;
  createdAt: string;
  campaign?: { id: string; name: string; emailAccountId: string | null } | null;
}

export interface ContactRow {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  timezone: string;
  status: string;
  isDNC: boolean;
  isUnsubscribed: boolean;
  unsubscribeToken: string | null;
  tags: string[] | null;
  linkedinUrl: string | null;
  createdAt: string;
  states: ContactCampaignState[];
}

export interface ActivityRow {
  id: string;
  type: string;
  timestamp: string;
  resendStatus: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  contact: {
    id: string;
    name: string | null;
    email: string;
    company: string | null;
  } | null;
}

export interface ContactTabCounts {
  all: number;
  unsent: number;
  today: number;
  replied: number;
  completed: number;
  bounced: number;
}

export interface EmailAccount {
  id: string;
  userId: string;
  label: string;
  senderName: string;
  senderEmail: string;
  provider: "smtp" | "resend";
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  resendApiKey: string | null;
  dailyLimit: number;
  isActive: boolean;
  tlsMode: string | null;
  imapHost: string | null;
  imapPort: number | null;
  imapEnabled: boolean;
  createdAt: string;
}

export interface CampaignStep {
  id: string;
  campaignId: string;
  stepNumber: number;
  delayDays: number;
  delayUnit: string;
  templateId: string | null;
  template: {
    id: string;
    name: string;
    subject: string | null;
    body: string;
    attachments: Array<{ name: string; url: string }> | null;
  } | null;
}
