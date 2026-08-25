import { BarChart2 } from "lucide-react";
import { getCampaignAnalytics } from "@/actions/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const campaigns = await getCampaignAnalytics();

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalReplied = campaigns.reduce((sum, c) => sum + c.replied, 0);
  const totalBounced = campaigns.reduce((sum, c) => sum + c.bounced, 0);
  const overallReplyRate =
    totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) + "%" : "0%";
  const overallBounceRate =
    totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) + "%" : "0%";

  const summaryCards = [
    { label: "Total Sent", value: totalSent, color: "text-blue-600" },
    { label: "Total Replied", value: totalReplied, color: "text-emerald-600" },
    { label: "Overall Reply Rate", value: overallReplyRate, color: "text-violet-600" },
    { label: "Overall Bounce Rate", value: overallBounceRate, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Analytics
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Campaign Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track performance across all campaigns — sent, replied, bounced, and more.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Table */}
      {campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No campaign data yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Create campaigns and send emails to see analytics here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Campaign",
                  "Contacts",
                  "Sent",
                  "Replied",
                  "Bounced",
                  "Completed",
                  "Reply Rate",
                  "Bounce Rate",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.totalContacts}</td>
                  <td className="px-4 py-3 text-slate-600">{c.sent}</td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-700 font-semibold">{c.replied}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-red-600 font-semibold">{c.bounced}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-violet-700 font-semibold">{c.completed}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {c.replyRate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      {c.bounceRate}
                    </span>
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
