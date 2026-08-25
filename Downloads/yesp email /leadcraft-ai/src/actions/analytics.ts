"use server";

import { supabase } from "@/lib/supabase";
import { dbLog } from "@/lib/db-error";

export type CampaignAnalytics = {
  id: string;
  name: string;
  totalContacts: number;
  sent: number;
  replied: number;
  bounced: number;
  completed: number;
  unsubscribed: number;
  replyRate: string;
  bounceRate: string;
};

export async function getCampaignAnalytics(): Promise<CampaignAnalytics[]> {
  const { data: campaigns, error: campError } = await supabase
    .from("Campaign")
    .select(`
      id,
      name,
      states:ContactCampaignState (
        status,
        contact:Contact (
          isUnsubscribed
        )
      )
    `)
    .order("createdAt", { ascending: false });

  if (campError) {
    dbLog("getCampaignAnalytics", campError);
    return [];
  }

  return (campaigns || []).map((campaign: any) => {
    const states: any[] = campaign.states || [];
    const totalContacts = states.length;
    const sent = states.filter((s) => s.status !== "New").length;
    const replied = states.filter((s) => s.status === "Replied").length;
    const bounced = states.filter((s) => s.status === "Bounced").length;
    const completed = states.filter((s) => s.status === "Completed").length;
    const unsubscribed = states.filter(
      (s) => s.status === "Unsubscribed" || s.contact?.isUnsubscribed === true
    ).length;

    const replyRate =
      sent > 0 ? ((replied / sent) * 100).toFixed(1) + "%" : "0%";
    const bounceRate =
      sent > 0 ? ((bounced / sent) * 100).toFixed(1) + "%" : "0%";

    return {
      id: campaign.id,
      name: campaign.name,
      totalContacts,
      sent,
      replied,
      bounced,
      completed,
      unsubscribed,
      replyRate,
      bounceRate,
    };
  });
}
