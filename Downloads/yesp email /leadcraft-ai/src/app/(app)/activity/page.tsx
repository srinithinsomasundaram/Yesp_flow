import { Activity } from "lucide-react";
import { getEmailActivity } from "@/actions/activity";
import { ClientTime } from "@/components/ClientTime";

export const dynamic = "force-dynamic";

// Groups are keyed by ISO date string (YYYY-MM-DD in UTC) so the server render
// is consistent; the actual displayed time inside each row is client-rendered.
function isoDateKey(ts: string) {
  return ts.slice(0, 10); // "2026-08-27"
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  sent:       { label: "Sent",       dot: "bg-slate-400",   bg: "bg-slate-50",   text: "text-slate-600",  border: "border-slate-200" },
  delivered:  { label: "Delivered",  dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200" },
  delayed:    { label: "Delayed",    dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  opened:     { label: "Opened",     dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
  clicked:    { label: "Clicked",    dot: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  bounced:    { label: "Bounced",    dot: "bg-red-500",     bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200" },
  complained: { label: "Complained", dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200" },
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.sent;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default async function ActivityPage() {
  const logs = await getEmailActivity();

  const groups: Record<string, typeof logs> = {};
  for (const log of logs) {
    const key = isoDateKey(log.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Email Logs</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">All sent emails and sequence actions, sorted by date.</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No activity yet</h3>
          <p className="text-sm text-slate-400 mt-1">Logs will appear here once emails start sending.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([key, entries]) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  {key} · {entries.length} {entries.length === 1 ? "event" : "events"}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Contact</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold">Delivery</th>
                      <th className="px-5 py-3 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((log) => {
                      const initials = ((log.contact as any)?.name || (log.contact as any)?.email || "?")
                        .substring(0, 2).toUpperCase();
                      const status = (log as any).resendStatus as string | null;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  {(log.contact as any)?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-slate-400 font-mono">
                                  {(log.contact as any)?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              {log.type}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400 font-mono tabular-nums">
                            <ClientTime ts={log.timestamp} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
