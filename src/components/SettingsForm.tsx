"use client";

import { useState } from "react";
import { updateSettings, sendTestEmail } from "@/actions/settings";
import {
  Save, Loader2, CheckCircle2, AlertCircle, Mail, Gauge, Clock, Webhook, Send,
} from "lucide-react";

const monoInputClass =
  "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none font-mono";
const inputClass =
  "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none";

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestStatus(null);
    const result = await sendTestEmail();
    setIsSendingTest(false);
    setTestStatus(result.success
      ? { type: "success", message: "Test email sent! Check your inbox." }
      : { type: "error", message: result.error ?? "Failed to send test email." }
    );
    setTimeout(() => setTestStatus(null), 6000);
  };

  const [reportingEmail,         setReportingEmail]         = useState(initialSettings?.reportingEmail || "");
  const [runLimit,               setRunLimit]               = useState<number>(initialSettings?.runLimit ?? 75);
  const [automationEnabled,      setAutomationEnabled]      = useState<boolean>(initialSettings?.automationEnabled ?? true);
  const [automationIntervalMins, setAutomationIntervalMins] = useState<number>(initialSettings?.automationIntervalMins ?? 60);
  const [webhookOutUrl,          setWebhookOutUrl]          = useState(initialSettings?.webhookOutUrl || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);
    const result = await updateSettings({
      reportingEmail: reportingEmail || undefined,
      runLimit,
      automationEnabled,
      automationIntervalMins,
      webhookOutUrl: webhookOutUrl || undefined,
    });
    setIsSaving(false);
    if (result.success) {
      const msg = (result as any).emailSent
        ? "Settings saved. Test email sent to reporting inbox ✓"
        : (result as any).emailWarning
          ? (result as any).emailWarning
          : "Settings saved.";
      const type = (result as any).emailWarning ? "error" : "success";
      setStatus({ type, message: msg });
      setTimeout(() => setStatus(null), 6000);
    } else {
      setStatus({ type: "error", message: result.error ?? "Failed to save settings." });
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-5">
      {/* Reporting Email */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Reporting Email</p>
            <p className="text-xs text-slate-500 mt-0.5">
              After every campaign run, Yesp Flow will generate a PDF activity log and email it here.
              Leave blank to skip reports.
            </p>
          </div>
        </div>

        <input
          type="email"
          placeholder="reports@yourcompany.com"
          value={reportingEmail}
          onChange={(e) => setReportingEmail(e.target.value)}
          className={inputClass}
        />
        <div className="flex items-center gap-3 mt-2">
          {reportingEmail && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 flex-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reports will be sent to {reportingEmail}
            </p>
          )}
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest || !reportingEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isSendingTest
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
            Send Test Mail
          </button>
        </div>
        {testStatus && (
          <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-xs font-medium ${
            testStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {testStatus.type === "success"
              ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {testStatus.message}
          </div>
        )}
      </div>

      {/* Run Limit */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Emails Per Run</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Maximum emails sent in a single automation run. Keeps sending volume under control.
              Applies globally across all campaigns.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={500}
            value={runLimit}
            onChange={(e) => setRunLimit(Math.max(1, Math.min(500, parseInt(e.target.value) || 75)))}
            className={inputClass + " max-w-[120px]"}
          />
          <span className="text-sm text-slate-500">emails / run <span className="text-slate-300">(max 500)</span></span>
        </div>
      </div>

      {/* Automation Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Automation Schedule</p>
            <p className="text-xs text-slate-500 mt-0.5">
              How often Yesp Flow automatically processes your active campaigns in the background.
              The campaign&apos;s own send window (start/end time, allowed days) is also respected.
            </p>
          </div>
        </div>

        {/* Enable / disable toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-700">Enable automation</span>
          <button
            type="button"
            onClick={() => setAutomationEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              automationEnabled ? "bg-blue-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                automationEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Interval selector — only shown when automation is on */}
        {automationEnabled && (
          <div className="flex items-center gap-3">
            <select
              value={automationIntervalMins}
              onChange={(e) => setAutomationIntervalMins(parseInt(e.target.value))}
              className={inputClass + " max-w-[200px]"}
            >
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={120}>Every 2 hours</option>
              <option value={240}>Every 4 hours</option>
              <option value={360}>Every 6 hours</option>
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Once a day</option>
            </select>
          </div>
        )}

        {!automationEnabled && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Automation is off. You can still trigger sends manually.
          </p>
        )}
      </div>

      {/* Outgoing Webhook */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <Webhook className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Outgoing Webhook</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Yesp Flow will POST a JSON payload to this URL after every email is sent. Use it to
              sync with your CRM, Zapier, or Slack. Leave blank to disable.
            </p>
          </div>
        </div>
        <input
          type="url"
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          value={webhookOutUrl}
          onChange={(e) => setWebhookOutUrl(e.target.value)}
          className={inputClass}
        />
        {webhookOutUrl && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Events will be POSTed to this URL
          </p>
        )}
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-500 leading-relaxed">
          {`{ "event": "email.sent", "contactEmail": "...", "campaignName": "...", "step": 1, "timestamp": "..." }`}
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </form>
  );
}
