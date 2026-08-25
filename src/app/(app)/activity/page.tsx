import { Activity } from "lucide-react";
import { getEmailActivity } from "@/actions/activity";

export const dynamic = "force-dynamic";

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ActivityPage() {
  const logs = await getEmailActivity();

  // Group by date
  const groups: Record<string, typeof logs> = {};
  for (const log of logs) {
    const label = formatDateLabel(log.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {Object.entries(groups).map(([label, entries]) => (
            <div key={label}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  {label} · {entries.length} {entries.length === 1 ? "event" : "events"}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Contact</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((log) => {
                      const initials = (log.contact?.name || log.contact?.email || "?")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  {log.contact?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-slate-400 font-mono">
                                  {log.contact?.email}
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
                          <td className="px-5 py-3 text-right text-xs text-slate-400 font-mono tabular-nums">
                            {formatTime(log.timestamp)}
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
