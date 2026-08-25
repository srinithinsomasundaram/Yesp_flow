"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { dbLog } from "@/lib/db-error";

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
};

export async function getEmailAccounts() {
  const { data, error } = await supabase
    .from("EmailAccount")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) dbLog("getEmailAccounts", error);
  return data || [];
}

export async function createEmailAccount(data: EmailAccountData) {
  const { data: account, error } = await supabase
    .from("EmailAccount")
    .insert([
      {
        label: data.label,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        provider: data.provider,
        smtpHost: data.smtpHost || "smtp.resend.com",
        smtpPort: data.smtpPort || 465,
        smtpUser: data.smtpUser || "resend",
        smtpPass: data.smtpPass || null,
        resendApiKey: data.resendApiKey || null,
        dailyLimit: data.dailyLimit || 50,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    ])
    .select()
    .single();

  if (error) {
    dbLog("createEmailAccount", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/email-accounts");
  return { success: true, account };
}

export async function updateEmailAccount(id: string, data: Partial<EmailAccountData>) {
  const { error } = await supabase
    .from("EmailAccount")
    .update(data)
    .eq("id", id);

  if (error) {
    dbLog("updateEmailAccount", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/email-accounts");
  return { success: true };
}

export async function deleteEmailAccount(id: string) {
  const { error } = await supabase
    .from("EmailAccount")
    .delete()
    .eq("id", id);

  if (error) {
    dbLog("deleteEmailAccount", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/email-accounts");
  return { success: true };
}

export async function testEmailAccount(id: string) {
  const { data: account, error } = await supabase
    .from("EmailAccount")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !account) {
    return { success: false, error: "Account not found" };
  }

  try {
    let transportConfig: nodemailer.TransportOptions;

    if (account.provider === "resend" && account.resendApiKey) {
      transportConfig = {
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: account.resendApiKey,
        },
      } as nodemailer.TransportOptions;
    } else {
      transportConfig = {
        host: account.smtpHost || "smtp.resend.com",
        port: account.smtpPort || 465,
        secure: account.smtpPort === 465,
        auth: {
          user: account.smtpUser || "resend",
          pass: account.smtpPass || "",
        },
      } as nodemailer.TransportOptions;
    }

    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.verify();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return { success: false, error: message };
  }
}
