"use client";

import { useState } from "react";
import { Zap, Copy, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const EVENTS = [
  "email.sent",
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 mb-1.5">{title}</p>
        {children}
      </div>
    </div>
  );
}

export function WebhookSetupGuide() {
  const [open, setOpen] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://flow.yespstudio.com";
  const webhookUrl = `${origin}/api/webhooks/resend?secret=YOUR_RESEND_WEBHOOK_SECRET`;
  const envLine    = `RESEND_WEBHOOK_SECRET=your-generated-secret`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Webhook Tracking Setup</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Enable real-time delivery, open &amp; click tracking in Activity logs
          </p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">

          {/* Step 1 */}
          <Step number={1} title="Add the env variable in your hosting dashboard (Nimbuz)">
            <p className="text-xs text-slate-500 mb-2">
              Go to your Nimbuz project → Environment Variables and add:
            </p>
            <div className="flex items-center gap-2 bg-slate-950 rounded-xl px-4 py-2.5">
              <code className="flex-1 text-xs text-emerald-400 font-mono break-all">{envLine}</code>
              <CopyButton text={envLine} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Replace <span className="font-mono text-slate-600">your-generated-secret</span> with any long random string. Then redeploy.
            </p>
          </Step>

          {/* Step 2 */}
          <Step number={2} title="Register the webhook URL in Resend">
            <p className="text-xs text-slate-500 mb-2">
              Go to{" "}
              <a
                href="https://resend.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                resend.com/webhooks <ExternalLink className="w-3 h-3" />
              </a>{" "}
              → Add Endpoint → paste this URL:
            </p>
            <div className="flex items-center gap-2 bg-slate-950 rounded-xl px-4 py-2.5">
              <code className="flex-1 text-xs text-sky-300 font-mono break-all">{webhookUrl}</code>
              <CopyButton text={webhookUrl} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Replace <span className="font-mono text-slate-600">YOUR_RESEND_WEBHOOK_SECRET</span> with the same value you set in Step 1.
            </p>
          </Step>

          {/* Step 3 */}
          <Step number={3} title="Enable these 6 events in Resend">
            <div className="flex flex-wrap gap-2 mt-1">
              {EVENTS.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {e}
                </span>
              ))}
            </div>
          </Step>

          {/* Step 4 */}
          <Step number={4} title="Run migration_v5.sql in Supabase">
            <p className="text-xs text-slate-500 mb-2">
              Open{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Supabase dashboard <ExternalLink className="w-3 h-3" />
              </a>{" "}
              → SQL Editor → paste and run the contents of <span className="font-mono text-slate-600">migration_v5.sql</span> from your project root. This adds the tracking columns to your EmailActivity table.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium">
              ⚠️ Without this migration, webhook events will silently fail to save.
            </div>
          </Step>

          {/* What you get */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Once set up, Activity logs show:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Sent",       dot: "bg-slate-400" },
                { label: "Delivered",  dot: "bg-emerald-500" },
                { label: "Opened",     dot: "bg-blue-500" },
                { label: "Clicked",    dot: "bg-violet-500" },
                { label: "Bounced",    dot: "bg-red-500" },
                { label: "Complained", dot: "bg-orange-500" },
              ].map(({ label, dot }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
