import { BarChart2, TrendingUp, Mail, Reply, AlertCircle, CheckCircle2 } from "lucide-react";
import { getCampaignAnalytics } from "@/actions/analytics";

export const dynamic = "force-dynamic";

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-600 w-8 text-right">{value}</span>
    </div>
  );
}

export default async function AnalyticsPage() {
  const campaigns = await getCampaignAnalytics();

  const totalSent      = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalReplied   = campaigns.reduce((sum, c) => sum + c.replied, 0);
  const totalBounced   = campaigns.reduce((sum, c) => sum + c.bounced, 0);
  const totalCompleted = campaigns.reduce((sum, c) => sum + c.completed, 0);
  const overallReplyRate  = totalSent > 0 ? ((totalReplied  / totalSent) * 100).toFixed(1) + "%" : "0%";
  const overallBounceRate = totalSent > 0 ? ((totalBounced  / totalSent) * 100).toFixed(1) + "%" : "0%";

  const maxSent    = Math.max(...campaigns.map((c) => c.sent), 1);
  const maxReplied = Math.max(...campaigns.map((c) => c.replied), 1);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Analytics</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Campaign Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track performance across all campaigns — sent, replied, bounced, and more.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent",     value: totalSent,      icon: Mail,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"   },
          { label: "Total Replied",  value: totalReplied,   icon: Reply,        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Reply Rate",     value: overallReplyRate,  icon: TrendingUp, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100"  },
          { label: "Bounce Rate",    value: overallBounceRate, icon: AlertCircle,color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100"     },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <div className={`w-7 h-7 rounded-xl border flex items-center justify-center ${bg} ${border}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No campaign data yet</p>
          <p className="text-sm text-slate-400 mt-1">Create campaigns and send emails to see analytics here.</p>
        </div>
      ) : (
        <>
          {/* Visual bar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Emails Sent vs Replied — by Campaign</h2>
            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{c.name}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2 shrink-0">{c.replyRate} reply</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 shrink-0">Sent</span>
                      <Bar value={c.sent}    max={maxSent}    color="bg-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 shrink-0">Replied</span>
                      <Bar value={c.replied} max={maxSent}    color="bg-emerald-500" />
                    </div>
                    {c.bounced > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-12 shrink-0">Bounced</span>
                        <Bar value={c.bounced} max={maxSent}   color="bg-red-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
              {[
                { color: "bg-blue-500",    label: "Sent" },
                { color: "bg-emerald-500", label: "Replied" },
                { color: "bg-red-400",     label: "Bounced" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Detailed Breakdown</h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Campaign", "Contacts", "Sent", "Replied", "Bounced", "Completed", "Reply Rate", "Bounce Rate"].map((col) => (
                    <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-violet-700 font-semibold">{c.completed}</span>
                      </div>
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
        </>
      )}
    </div>
  );
}
