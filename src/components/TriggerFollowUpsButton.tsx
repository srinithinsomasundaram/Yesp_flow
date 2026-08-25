"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { triggerFollowUps } from "@/actions/dashboard";

export function TriggerFollowUpsButton({ campaignId, label = "Run AI Pipeline Now", variant = "primary" }: { campaignId?: string; label?: string; variant?: "primary" | "white" }) {
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const handleTrigger = async () => {
    setIsRunning(true);
    const result = await triggerFollowUps(campaignId, true);
    setIsRunning(false);

    if (!result.success) {
      setToast({ show: true, message: result.errors?.[0] ?? "Unknown error", type: "error" });
    } else if (result.processedCount === 0 && result.errors?.length) {
      setToast({ show: true, message: result.errors[0], type: "error" });
    } else {
      const parts: string[] = [`Sent ${result.processedCount}`];
      if (result.skipped) parts.push(`${result.skipped} skipped`);
      if (result.errors?.length) parts.push(`${result.errors.length} failed`);
      setToast({ show: true, message: parts.join(" · "), type: result.processedCount > 0 ? "success" : "error" });
    }

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleTrigger}
        disabled={isRunning}
        className={`w-full justify-center px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60 transition-colors ${
          variant === "white"
            ? "bg-white text-blue-600 hover:bg-blue-50"
            : "btn-primary"
        }`}
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300 fill-white/20" />
        )}
        <span>{isRunning ? "Running AI Engine..." : label}</span>
      </button>

      {/* Floating Status Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === "success" 
            ? "bg-white border-emerald-300 text-emerald-800 shadow-xl font-bold" 
            : "bg-white border-red-300 text-red-800 shadow-xl font-bold"
        }`}>
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

