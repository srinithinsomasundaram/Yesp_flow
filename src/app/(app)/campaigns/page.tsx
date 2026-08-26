import { Send, Layers, ArrowRight, Zap } from "lucide-react";
import { getCampaigns } from "@/actions/campaigns";
import { getTemplates } from "@/actions/templates";
import { CampaignForm } from "@/components/CampaignForm";
import { CampaignActions } from "@/components/CampaignActions";
import { TestSendButton } from "@/components/TestSendButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, templates] = await Promise.all([getCampaigns(), getTemplates()]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Campaigns</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Outreach Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Multi-step follow-up sequences with sending schedules and daily caps.{" "}
            <span className="font-medium text-slate-700">{campaigns.length} total.</span>
          </p>
        </div>
        <CampaignForm templates={templates} />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
        {campaigns.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No campaigns yet</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Create your first campaign to start automating cold email sequences.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider rounded-tl-2xl">Campaign</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Steps</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden md:table-cell">Contacts</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden sm:table-cell">Daily Limit</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign: any) => {
                const contactCount = campaign.states?.length ?? 0;
                const createdAt = campaign.createdAt
                  ? new Date(campaign.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <tr key={campaign.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {campaign.name}
                          </Link>
                          {campaign.emailAccount && (
                            <p className="text-xs text-slate-400 mt-0.5">{campaign.emailAccount.label}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Steps */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        {campaign.steps?.length ?? 0}
                      </span>
                    </td>

                    {/* Contacts */}
                    <td className="px-4 py-4 text-center hidden md:table-cell">
                      <span className="text-slate-700 font-medium">{contactCount}</span>
                    </td>

                    {/* Daily Limit */}
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" /> {campaign.dailyLimit}/day
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4 text-xs text-slate-500 hidden lg:table-cell">{createdAt}</td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <TestSendButton campaign={campaign} />
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                          Manage <ArrowRight className="w-3 h-3" />
                        </Link>
                        <CampaignActions campaign={campaign} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
