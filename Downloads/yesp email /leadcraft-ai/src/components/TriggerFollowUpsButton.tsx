"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";

interface Progress {
  total:   number;
  done:    number;
  current: string;
}

export function TriggerFollowUpsButton({
  campaignId,
  label = "Run AI Pipeline Now",
  variant = "primary",
}: {
  campaignId?: string;
  label?: string;
  variant?: "primary" | "white";
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress]   = useState<Progress | null>(null);
  const [toast, setToast]         = useState<{
    show: boolean; message: string; type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 5000);
  };

  const handleTrigger = async () => {
    setIsRunning(true);
    setProgress({ total: 0, done: 0, current: "" });

    try {
      const response = await fetch("/api/run-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, force: true }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "start") {
              setProgress({ total: event.total ?? 0, done: 0, current: "" });
            } else if (event.type === "sent") {
              setProgress(p => ({
                total:   p?.total ?? event.total ?? 0,
                done:    event.count ?? (p?.done ?? 0) + 1,
                current: event.contact || event.email || "",
              }));
            } else if (event.type === "skipped" || event.type === "failed") {
              setProgress(p => p ? { ...p, done: p.done + 1, current: event.email || "" } : p);
            } else if (event.type === "done") {
              const parts: string[] = [`Sent ${event.sent ?? 0}`];
              if ((event.skipped ?? 0) > 0)      parts.push(`${event.skipped} skipped`);
              if ((event.failed  ?? 0) > 0)      parts.push(`${event.failed} failed`);
              if ((event.errors  ?? []).length > 0 && (event.sent ?? 0) === 0) {
                showToast(event.errors![0], "error");
              } else {
                showToast(parts.join(" · "), (event.sent ?? 0) > 0 ? "success" : "error");
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      showToast(err?.message ?? "Failed to start send run.", "error");
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const pct   = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const btnCls = variant === "white"
    ? "bg-white text-blue-600 hover:bg-blue-50"
    : "btn-primary";

  return (
    <div className="relative">
      <button
        onClick={handleTrigger}
        disabled={isRunning}
        className={`w-full justify-center px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60 transition-colors ${btnCls}`}
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 fill-white/20" />
        )}
        <span>{isRunning ? "Running..." : label}</span>
      </button>

      {/* Live progress panel */}
      {isRunning && progress !== null && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-bold text-slate-900">Sending Campaign</span>
            <span className="ml-auto text-xs font-mono text-slate-500">
              {progress.done}/{progress.total}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {progress.current && (
            <p className="text-xs text-slate-500 truncate">
              <span className="font-medium text-slate-700">Now:</span> {progress.current}
            </p>
          )}

          <p className="text-xs text-slate-400 mt-1">{pct}% complete — do not close this tab</p>
        </div>
      )}

      {/* Toast notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-white border-emerald-300 text-emerald-800"
              : "bg-white border-red-300 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
