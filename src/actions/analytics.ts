"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";
import { getCurrentUserId } from "@/lib/auth-helper";

export type CampaignAnalytics = {
  id: string; name: string; totalContacts: number;
  sent: number; replied: number; bounced: number;
  completed: number; unsubscribed: number;
  replyRate: string; bounceRate: string;
};

export async function getCampaignAnalytics(): Promise<CampaignAnalytics[]> {
  const userId = await getCurrentUserId();

  const { data: campaigns, error } = await supabase
    .from("Campaign")
    .select(`id, name, states:ContactCampaignState (status, contact:Contact (isUnsubscribed))`)
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) { dbLog("getCampaignAnalytics", error); return []; }

  return (campaigns || []).map((campaign: any) => {
    const states: any[] = campaign.states || [];
    const sent = states.filter((s) => s.status !== "New").length;
    const replied = states.filter((s) => s.status === "Replied").length;
    const bounced = states.filter((s) => s.status === "Bounced").length;
    return {
      id: campaign.id, name: campaign.name,
      totalContacts: states.length, sent, replied, bounced,
      completed: states.filter((s) => s.status === "Completed").length,
      unsubscribed: states.filter((s) => s.status === "Unsubscribed" || s.contact?.isUnsubscribed).length,
      replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) + "%" : "0%",
      bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(1) + "%" : "0%",
    };
  });
}
