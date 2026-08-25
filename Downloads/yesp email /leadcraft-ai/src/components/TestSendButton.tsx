"use client";

import { useState } from "react";
import { Send, X, Loader2, CheckCircle2, AlertCircle, FlaskConical } from "lucide-react";
import { sendTestEmail } from "@/actions/dashboard";

export function TestSendButton({ campaign }: { campaign: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [stepId, setStepId] = useState(campaign.steps?.[0]?.id ?? "");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const steps = campaign.steps || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !stepId) return;
    setIsSending(true);
    setResult(null);
    const res = await sendTestEmail(campaign.id, stepId, toEmail);
    setIsSending(false);
    if (res.success) {
      setResult({ type: "success", message: `Test email sent to ${toEmail}` });
    } else {
      setResult({ type: "error", message: res.error ?? "Failed to send." });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setToEmail("");
    setStepId(steps[0]?.id ?? "");
  };

  if (steps.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Send test email"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Test
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-slate-900">Send Test Email</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Sends a real email using dummy contact data so merge tags resolve. Subject is prefixed with{" "}
                <span className="font-mono bg-slate-100 px-1 rounded">[TEST]</span>.
              </p>

              {/* Step selector */}
              {steps.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Step to test</label>
                  <select
                    value={stepId}
                    onChange={(e) => setStepId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                  >
                    {steps.map((step: any, idx: number) => (
                      <option key={step.id} value={step.id}>
                        Step {idx + 1} — {step.template?.name ?? "Untitled"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Send to</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none bg-white"
                />
              </div>

              {/* Feedback */}
              {result && (
                <div
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${
                    result.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {result.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  {result.message}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
