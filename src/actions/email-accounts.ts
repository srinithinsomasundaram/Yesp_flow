"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId, hasPermission } from "@/lib/auth-helper";

export type EmailAccountData = {
  label: string;
  senderName: string;
  senderEmail: string;
  provider: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
  dailyLimit?: number;
  isActive?: boolean;
  // TLS mode (SMTP only): 'opportunistic' | 'enforced'
  tlsMode?: string;
  // IMAP reply-detection fields (SMTP accounts only)
  imapHost?: string;
  imapPort?: number;
  imapEnabled?: boolean;
};

export async function getEmailAccounts() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("EmailAccount")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });
  if (error) dbLog("getEmailAccounts", error);
  return data || [];
}

export async function createEmailAccount(data: EmailAccountData) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to add email accounts." };

  if (data.provider === "resend" && !data.resendApiKey?.trim()) {
    return { success: false, error: "A Resend API key is required for Resend accounts." };
  }

  const userId = await getCurrentUserId();
  const { data: account, error } = await supabase
    .from("EmailAccount")
    .insert([{
      userId,
      label: data.label,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      provider: data.provider,
      smtpHost: data.smtpHost || "smtp.resend.com",
      smtpPort: data.smtpPort || 465,
      smtpUser: data.smtpUser || "resend",
      smtpPass: data.smtpPass || null,
      resendApiKey: data.resendApiKey?.trim() || null,
      dailyLimit: data.dailyLimit || 50,
      isActive: data.isActive !== undefined ? data.isActive : true,
      tlsMode: data.tlsMode || "opportunistic",
      imapHost: data.imapHost?.trim() || null,
      imapPort: data.imapPort || 993,
      imapEnabled: data.imapEnabled ?? false,
    }])
    .select()
    .single();

  if (error) { dbLog("createEmailAccount", error); return { success: false, error: error.message }; }
  revalidatePath("/email-accounts");
  return { success: true, account };
}

export async function updateEmailAccount(id: string, data: Partial<EmailAccountData>) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to update email accounts." };

  if (data.provider === "resend" && data.resendApiKey !== undefined && !data.resendApiKey?.trim()) {
    return { success: false, error: "A Resend API key is required for Resend accounts." };
  }

  const userId = await getCurrentUserId();
  const payload = { ...data, resendApiKey: data.resendApiKey?.trim() || undefined };
  const { error } = await supabase.from("EmailAccount").update(payload).eq("id", id).eq("userId", userId);
  if (error) { dbLog("updateEmailAccount", error); return { success: false, error: error.message }; }
  revalidatePath("/email-accounts");
  return { success: true };
}

export async function deleteEmailAccount(id: string) {
  if (!await hasPermission("admin")) return { success: false, error: "Admin access required to delete email accounts." };
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("EmailAccount").delete().eq("id", id).eq("userId", userId);
  if (error) { dbLog("deleteEmailAccount", error); return { success: false, error: error.message }; }
  revalidatePath("/email-accounts");
  return { success: true };
}

export async function testEmailAccount(id: string) {
  const userId = await getCurrentUserId();
  const { data: account, error } = await supabase
    .from("EmailAccount")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single();

  if (error || !account) return { success: false, error: "Account not found" };

  try {
    let transportConfig: nodemailer.TransportOptions;
    if (account.provider === "resend" && account.resendApiKey) {
      transportConfig = { host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: account.resendApiKey } } as nodemailer.TransportOptions;
    } else {
      const port = account.smtpPort || 465;
      const secure = port === 465;
      const requireTLS = !secure && account.tlsMode === "enforced";
      transportConfig = { host: account.smtpHost || "smtp.resend.com", port, secure, requireTLS: requireTLS || undefined, auth: { user: account.smtpUser || "resend", pass: account.smtpPass || "" } } as nodemailer.TransportOptions;
    }
    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.verify();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}
