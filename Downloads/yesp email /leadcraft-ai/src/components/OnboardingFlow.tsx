"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Mail, Users, CheckCircle2, Loader2,
  Upload, Plus, X, Zap, Server,
} from "lucide-react";
import { createEmailAccount } from "@/actions/email-accounts";
import { importContacts } from "@/actions/contacts";
import Papa from "papaparse";

const STEPS = ["Welcome", "Email Setup", "Add Contacts", "All Done"];

// ─── Step 1: Welcome ───────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="Flow" className="h-16 w-16 object-contain rounded-2xl shadow-lg" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Flow</h1>
        <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
          Let's get you set up in 2 minutes. We'll connect your email and load your first contacts.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {[
          { icon: Mail, label: "Connect Email", desc: "SMTP or Resend API" },
          { icon: Users, label: "Add Contacts", desc: "CSV or manual entry" },
          { icon: Zap, label: "Start Sending", desc: "Automated sequences" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <Icon className="w-5 h-5 text-blue-600 mb-1.5" />
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
        Get Started <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Step 2: Email Setup ────────────────────────────────────────────
function StepEmail({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [provider, setProvider] = useState<"smtp" | "resend">("smtp");
  const [form, setForm] = useState({
    label: "My Email",
    senderName: "",
    senderEmail: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    resendApiKey: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const result = await createEmailAccount({
        label: form.label,
        senderName: form.senderName,
        senderEmail: form.senderEmail,
        provider,
        ...(provider === "smtp"
          ? {
              smtpHost: form.smtpHost,
              smtpPort: parseInt(form.smtpPort) || 587,
              smtpUser: form.smtpUser,
              smtpPass: form.smtpPass,
            }
          : { resendApiKey: form.resendApiKey }),
        dailyLimit: 50,
        isActive: true,
      });
      if (result.success) {
        onNext();
      } else {
        setError(result.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Connect your email</h2>
        <p className="text-sm text-slate-500 mt-1">This is the account Flow will send from.</p>
      </div>

      {/* Provider toggle */}
      <div className="flex gap-2">
        {(["smtp", "resend"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              provider === p
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {p === "smtp" ? <Server className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {p === "smtp" ? "SMTP" : "Resend API"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sender name" value={form.senderName} onChange={(v) => set("senderName", v)} placeholder="Jane Smith" />
          <Field label="Sender email" value={form.senderEmail} onChange={(v) => set("senderEmail", v)} placeholder="jane@company.com" type="email" />
        </div>

        {provider === "smtp" ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="SMTP host" value={form.smtpHost} onChange={(v) => set("smtpHost", v)} placeholder="smtp.gmail.com" />
              </div>
              <Field label="Port" value={form.smtpPort} onChange={(v) => set("smtpPort", v)} placeholder="587" />
            </div>
            <Field label="Username / email" value={form.smtpUser} onChange={(v) => set("smtpUser", v)} placeholder="you@gmail.com" />
            <Field label="Password / app password" value={form.smtpPass} onChange={(v) => set("smtpPass", v)} placeholder="••••••••" type="password" />
          </>
        ) : (
          <Field label="Resend API key" value={form.resendApiKey} onChange={(v) => set("resendApiKey", v)} placeholder="re_••••••••" type="password" />
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button onClick={onSkip} className="btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold">
          Skip for now
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.senderEmail || !form.senderName}
          className="btn-primary flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Save & Continue
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Add Contacts ───────────────────────────────────────────
function StepContacts({ onNext }: { onNext: () => void }) {
  const [tab, setTab] = useState<"csv" | "manual">("csv");
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualList, setManualList] = useState<{ email: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFile = (file: File) => {
    setCsvError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as any[];
        if (!rows.length) { setCsvError("No rows found in CSV."); return; }
        if (!rows[0].email && !rows[0].Email) { setCsvError("CSV must have an 'email' column."); return; }
        setCsvRows(rows.map((r) => ({ email: r.email || r.Email, name: r.name || r.Name || "" })));
      },
    });
  };

  const addManual = () => {
    if (!manualEmail) return;
    setManualList((l) => [...l, { email: manualEmail, name: manualName }]);
    setManualEmail("");
    setManualName("");
  };

  const handleSave = async () => {
    const rows = tab === "csv" ? csvRows : manualList;
    if (!rows.length) { onNext(); return; }
    setSaving(true);
    await importContacts(rows);
    setSaved(true);
    setSaving(false);
    setTimeout(onNext, 800);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Add your contacts</h2>
        <p className="text-sm text-slate-500 mt-1">Import a CSV list or add contacts one by one.</p>
      </div>

      <div className="flex gap-2">
        {(["csv", "manual"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              tab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {t === "csv" ? "Upload CSV" : "Add Manually"}
          </button>
        ))}
      </div>

      {tab === "csv" ? (
        <div>
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-700">Drop CSV here or click to browse</span>
            <span className="text-xs text-slate-400 mt-1">Must have an <code className="bg-slate-200 px-1 rounded">email</code> column</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          {csvError && <p className="text-xs text-red-600 mt-2">{csvError}</p>}
          {csvRows.length > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {csvRows.length} contacts ready to import
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Name"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            />
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="email@example.com"
              onKeyDown={(e) => e.key === "Enter" && addManual()}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            />
            <button onClick={addManual} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {manualList.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {manualList.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs">
                  <span className="text-slate-700 font-medium">{c.name || c.email}</span>
                  <span className="text-slate-400 font-mono">{c.email}</span>
                  <button onClick={() => setManualList((l) => l.filter((_, j) => j !== i))}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onNext} className="btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold">
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="btn-primary flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Imported!</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> Import & Continue</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Done ───────────────────────────────────────────────────
function StepDone() {
  const router = useRouter();

  const handleDone = () => {
    // Set cookie so layout skips DB check on every page
    document.cookie = "flow_onboarded=1; path=/; max-age=31536000; SameSite=Lax";
    router.push("/");
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">You're all set!</h2>
        <p className="text-slate-500 mt-2 text-sm">Flow is ready to send your outreach campaigns.</p>
      </div>
      <button
        onClick={handleDone}
        className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Field helper ───────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
      />
    </div>
  );
}

// ─── Main Onboarding Flow ───────────────────────────────────────────
export function OnboardingFlow() {
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => s + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-blue-600 text-white" :
                  "bg-slate-200 text-slate-500"
                }`}>
                  {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 sm:w-24 transition-colors ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-right">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {step === 0 && <StepWelcome onNext={next} />}
          {step === 1 && <StepEmail onNext={next} onSkip={next} />}
          {step === 2 && <StepContacts onNext={next} />}
          {step === 3 && <StepDone />}
        </div>
      </div>
    </div>
  );
}
