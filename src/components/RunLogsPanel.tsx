"use client";

import { useRouter } from "next/navigation";
import { History, Download, RefreshCw } from "lucide-react";
import type { RunLogSummary } from "@/actions/run-logs";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RunLogsPanel({
  campaignId,
  initialLogs,
}: {
  campaignId: string;
  initialLogs: RunLogSummary[];
}) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Run History
        </h3>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {initialLogs.length === 0 ? (
        <div className="px-6 py-12 text-center text-slate-400 text-sm">
          No runs yet — click Run Now to send your first batch.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date / Time", "Triggered By", "Status", "Sent", "Skipped", "Failed", "Report"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  {/* Date */}
                  <td className="px-6 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                    {formatDate(log.startedAt || log.completedAt)}
                  </td>

                  {/* Triggered by */}
                  <td className="px-6 py-3.5">
                    {log.triggeredBy === "cron" ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Scheduled
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Manual
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    {log.status === "completed" ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    ) : log.status === "running" ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Running
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {log.status}
                      </span>
                    )}
                  </td>

                  {/* Sent */}
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold text-emerald-600">{log.totalSent ?? 0}</span>
                    <span className="text-xs text-slate-400 ml-1">sent</span>
                  </td>

                  {/* Skipped */}
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold text-amber-600">{log.totalSkipped ?? 0}</span>
                    <span className="text-xs text-slate-400 ml-1">skipped</span>
                  </td>

                  {/* Failed */}
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-bold text-red-500">{log.totalFailed ?? 0}</span>
                    <span className="text-xs text-slate-400 ml-1">failed</span>
                  </td>

                  {/* Download PDF */}
                  <td className="px-6 py-3.5">
                    <a
                      href={`/api/report?runId=${log.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
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
