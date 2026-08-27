"use client";

import { useState } from "react";
import {
  Mail,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Wifi,
} from "lucide-react";
import {
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  testEmailAccount,
} from "@/actions/email-accounts";

const PROVIDERS = ["smtp", "resend"] as const;
type Provider = (typeof PROVIDERS)[number];

const emptyForm = {
  label: "",
  senderName: "",
  senderEmail: "",
  provider: "smtp" as Provider,
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  resendApiKey: "",
  dailyLimit: 50,
};

export function EmailAccountManager({ accounts }: { accounts: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    error?: string;
  } | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const openEdit = (account: any) => {
    setEditingId(account.id);
    setSaveError(null);
    setForm({
      label: account.label || "",
      senderName: account.senderName || "",
      senderEmail: account.senderEmail || "",
      provider: account.provider || "smtp",
      smtpHost: account.smtpHost || "smtp.gmail.com",
      smtpPort: account.smtpPort || 587,
      smtpUser: account.smtpUser || "",
      smtpPass: account.smtpPass || "",
      resendApiKey: account.resendApiKey || "",
      dailyLimit: account.dailyLimit || 50,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (form.provider === "resend" && !form.resendApiKey.trim()) {
      setSaveError("A Resend API key is required.");
      return;
    }

    setIsSaving(true);

    const payload = {
      label: form.label,
      senderName: form.senderName,
      senderEmail: form.senderEmail,
      provider: form.provider,
      smtpHost: form.smtpHost,
      smtpPort: form.smtpPort,
      smtpUser: form.smtpUser,
      smtpPass: form.smtpPass || undefined,
      resendApiKey: form.resendApiKey || undefined,
      dailyLimit: form.dailyLimit,
    };

    const result = editingId
      ? await updateEmailAccount(editingId, payload)
      : await createEmailAccount(payload);

    setIsSaving(false);

    if (!result.success) {
      setSaveError(result.error ?? "Failed to save account.");
      return;
    }

    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this email account?")) return;
    await deleteEmailAccount(id);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    const result = await testEmailAccount(id);
    setTestingId(null);
    setTestResult({ id, ...result });
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No email accounts yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add your first sender account to start sending outreach emails.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{account.label}</p>
                    <p className="text-xs text-slate-500 font-mono">{account.senderEmail}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    account.provider === "resend"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {account.provider === "resend" ? "Resend" : "SMTP"}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 mb-4">
                <p>
                  <span className="font-semibold text-slate-600">Sender:</span>{" "}
                  {account.senderName}
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Daily limit:</span>{" "}
                  {account.dailyLimit} emails
                </p>
              </div>

              {testResult && testResult.id === account.id && (
                <div
                  className={`flex items-center gap-2 text-xs font-semibold mb-3 px-3 py-2 rounded-xl ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {testResult.success ? "Connection successful!" : testResult.error}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleTest(account.id)}
                  disabled={testingId === account.id}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-slate-600 disabled:opacity-50"
                >
                  {testingId === account.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  Test
                </button>
                <button
                  onClick={() => openEdit(account)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-slate-600"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-sm border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-50 flex items-center gap-1.5 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                {editingId ? "Edit Email Account" : "Add Email Account"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Label */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Account Label *
                </label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Primary Outreach"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                />
              </div>

              {/* Sender Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Sender Name *
                  </label>
                  <input
                    required
                    value={form.senderName}
                    onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Sender Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.senderEmail}
                    onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                    placeholder="john@company.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Provider Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Provider
                </label>
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, provider: p })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        form.provider === p
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {p === "resend" ? "Resend" : "SMTP"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider-specific fields */}
              {form.provider === "resend" ? (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Resend API Key *
                  </label>
                  <input
                    required
                    type="password"
                    value={form.resendApiKey}
                    onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })}
                    placeholder="re_..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        SMTP Host *
                      </label>
                      <input
                        required
                        value={form.smtpHost}
                        onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Port *
                      </label>
                      <input
                        required
                        type="number"
                        value={form.smtpPort}
                        onChange={(e) =>
                          setForm({ ...form, smtpPort: parseInt(e.target.value) || 587 })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        SMTP Username *
                      </label>
                      <input
                        required
                        value={form.smtpUser}
                        onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                        placeholder="user@gmail.com"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        SMTP Password
                      </label>
                      <input
                        type="password"
                        value={form.smtpPass}
                        onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                        placeholder="App password"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Limit */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Daily Send Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={form.dailyLimit}
                  onChange={(e) =>
                    setForm({ ...form, dailyLimit: parseInt(e.target.value) || 50 })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                />
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
