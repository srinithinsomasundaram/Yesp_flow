"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId } from "@/lib/auth-helper";

export async function getCampaigns() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("Campaign")
    .select(`
      *,
      steps:CampaignStep (*, template:Template (*)),
      states:ContactCampaignState (*, contact:Contact (*))
    `)
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) dbLog("getCampaigns", error);
  return (data || []).map((c) => ({
    ...c,
    steps: (c.steps || []).sort((a: any, b: any) => a.stepNumber - b.stepNumber),
  }));
}

export async function getCampaign(id: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("Campaign")
    .select(`
      *,
      steps:CampaignStep (*, template:Template (*)),
      states:ContactCampaignState (*, contact:Contact (*))
    `)
    .eq("id", id)
    .eq("userId", userId)
    .single();

  if (error || !data) { dbLog("getCampaign", error); return null; }

  let emailAccount = null;
  if (data.emailAccountId) {
    const { data: acct } = await supabase
      .from("EmailAccount")
      .select("*")
      .eq("id", data.emailAccountId)
      .eq("userId", userId)
      .single();
    emailAccount = acct ?? null;
  }

  return {
    ...data,
    emailAccount,
    steps: (data.steps || []).sort((a: any, b: any) => a.stepNumber - b.stepNumber),
  };
}

export async function createCampaign(data: {
  name: string;
  dailyLimit: number;
  steps: any[];
  timezone?: string;
  sendingDays?: string;
  startTime?: string;
  endTime?: string;
}) {
  const userId = await getCurrentUserId();
  const { data: campaign, error: campError } = await supabase
    .from("Campaign")
    .insert([{
      userId,
      name: data.name,
      dailyLimit: data.dailyLimit,
      timezone: data.timezone || "Asia/Kolkata",
      sendingDays: data.sendingDays || "Mon,Tue,Wed,Thu,Fri",
      startTime: data.startTime || "09:00",
      endTime: data.endTime || "17:00",
    }])
    .select()
    .single();

  if (campError || !campaign) { dbLog("createCampaign", campError); return { success: false, error: campError }; }

  if (data.steps?.length > 0) {
    const { error: stepsError } = await supabase.from("CampaignStep").insert(
      data.steps.map((step) => ({
        campaignId: campaign.id,
        stepNumber: step.stepNumber,
        templateId: step.templateId,
        delayDays: step.delayDays,
        delayUnit: step.delayUnit || "days",
      }))
    );
    if (stepsError) dbLog("createCampaignSteps", stepsError);
  }

  // Auto-assign this user's existing contacts
  const { data: contacts } = await supabase
    .from("Contact")
    .select("id")
    .eq("userId", userId);

  if (contacts?.length) {
    await supabase.from("ContactCampaignState").insert(
      contacts.map((c) => ({ contactId: c.id, campaignId: campaign.id, currentStep: 0, status: "New" }))
    );
  }

  revalidatePath("/campaigns");
  return { success: true, campaign };
}

export async function deleteCampaign(id: string) {
  const userId = await getCurrentUserId();
  await supabase.from("Campaign").delete().eq("id", id).eq("userId", userId);
  revalidatePath("/campaigns");
  return { success: true };
}

export async function updateCampaign(id: string, updates: {
  name?: string; dailyLimit?: number; pacingSeconds?: number;
  cronTime?: string; cronEnabled?: boolean; timezone?: string;
  sendingDays?: string; startTime?: string; endTime?: string;
  emailAccountId?: string; status?: string;
}) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("Campaign").update(updates).eq("id", id).eq("userId", userId);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return { success: !error };
}

export async function removeContactFromCampaign(contactId: string, campaignId: string) {
  const { error } = await supabase
    .from("ContactCampaignState")
    .delete()
    .match({ contactId, campaignId });
  if (error) dbLog("removeContactFromCampaign", error);
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: !error };
}

export async function addCampaignStep(campaignId: string, templateId: string, delayDays: number, stepNumber: number, delayUnit?: string) {
  const { error } = await supabase.from("CampaignStep").insert([
    { campaignId, templateId, delayDays, stepNumber, delayUnit: delayUnit || "days" },
  ]);
  if (error) dbLog("addCampaignStep", error);
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: !error };
}

export async function updateCampaignStep(stepId: string, templateId: string, delayDays: number, delayUnit?: string) {
  const { error } = await supabase
    .from("CampaignStep")
    .update({ templateId, delayDays, delayUnit: delayUnit || "days" })
    .eq("id", stepId);
  if (error) dbLog("updateCampaignStep", error);
  return { success: !error };
}

export async function removeCampaignStep(stepId: string, campaignId: string) {
  const { error } = await supabase.from("CampaignStep").delete().eq("id", stepId);
  if (error) dbLog("removeCampaignStep", error);
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: !error };
}
