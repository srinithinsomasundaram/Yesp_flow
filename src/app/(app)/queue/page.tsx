import { Clock } from "lucide-react";
import { getContacts } from "@/actions/contacts";
import { getCampaigns } from "@/actions/campaigns";
import { TriggerFollowUpsButton } from "@/components/TriggerFollowUpsButton";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const [contacts, campaigns] = await Promise.all([getContacts(), getCampaigns()]);

  const now = new Date();

  // Build queue items from ContactCampaignState
  type QueueItem = {
    contactId: string;
    contactName: string;
    contactEmail: string;
    campaignId: string;
    campaignName: string;
    stepNumber: number;
    templateName: string;
    scheduledDate: Date | null;
    status: string;
  };

  const queueItems: QueueItem[] = [];

  for (const contact of contacts) {
    const states: any[] = contact.states || [];
    for (const state of states) {
      const isNew = state.status === "New";
      const isWaiting =
        state.status === "Waiting" &&
        state.nextActionDate &&
        new Date(state.nextActionDate) <= now;

      if (isNew || isWaiting) {
        const campaign = campaigns.find((c: any) => c.id === state.campaignId);
        const currentStep = campaign?.steps?.[state.currentStep];
        queueItems.push({
          contactId: contact.id,
          contactName: contact.name || contact.email,
          contactEmail: contact.email,
          campaignId: state.campaignId,
          campaignName: campaign?.name || "Unknown Campaign",
          stepNumber: (state.currentStep || 0) + 1,
          templateName: currentStep?.template?.name || "—",
          scheduledDate: state.nextActionDate ? new Date(state.nextActionDate) : null,
          status: state.status,
        });
      }
    }
  }

  const newEmails = queueItems.filter((q) => q.status === "New").length;
  const followUps = queueItems.filter((q) => q.status === "Waiting").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Queue
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Today&apos;s Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {queueItems.length} actions pending —{" "}
            <span className="text-blue-600 font-semibold">{newEmails} new emails</span>,{" "}
            <span className="text-amber-600 font-semibold">{followUps} follow-ups</span>
          </p>
        </div>
        <div className="shrink-0">
          <TriggerFollowUpsButton label="Run Now" />
        </div>
      </div>

      {queueItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Queue is empty</p>
          <p className="text-sm text-slate-400 mt-1">
            No emails are scheduled for today. Add contacts to campaigns to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Contact", "Campaign", "Step #", "Template", "Scheduled", "Status"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{item.contactName}</div>
                    <div className="text-xs text-slate-500 font-mono">{item.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {item.campaignName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">#{item.stepNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{item.templateName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {item.scheduledDate
                      ? item.scheduledDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Now"}
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "New" ? (
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        New Email
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        Follow-up
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
