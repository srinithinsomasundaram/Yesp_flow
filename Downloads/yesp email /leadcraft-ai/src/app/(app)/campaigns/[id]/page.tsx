import { getCampaign } from "@/actions/campaigns";
import { getTemplates } from "@/actions/templates";
import { getEmailAccounts } from "@/actions/email-accounts";
import { notFound } from "next/navigation";
import { CampaignSettings } from "@/components/CampaignSettings";
import { CampaignFlowEditor } from "@/components/CampaignFlowEditor";
import { CampaignContactsTable } from "@/components/CampaignContactsTable";

export const dynamic = "force-dynamic";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [campaign, templates, emailAccounts] = await Promise.all([
    getCampaign(resolvedParams.id),
    getTemplates(),
    getEmailAccounts(),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-16">
      <CampaignSettings campaign={campaign} emailAccounts={emailAccounts} />
      <CampaignFlowEditor campaign={campaign} templates={templates} />
      <CampaignContactsTable campaign={campaign} />
    </div>
  );
}
