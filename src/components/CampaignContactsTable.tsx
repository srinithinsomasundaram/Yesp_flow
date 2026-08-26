"use client";

import { useState } from "react";
import { Users, Trash2, MessageSquare, Loader2, CheckCircle2, X, Reply } from "lucide-react";
import { removeContactFromCampaign } from "@/actions/campaigns";
import { markAsReplied } from "@/actions/contacts";

const STATUS_STYLE: Record<string, string> = {
  New:       "bg-blue-50 text-blue-700 border-blue-200",
  Waiting:   "bg-amber-50 text-amber-700 border-amber-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Replied:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-purple-50 text-purple-700 border-purple-200",
  Bounced:   "bg-red-50 text-red-700 border-red-200",
};

function ReplyModal({
  state,
  onClose,
  onDone,
}: {
  state: any;
  onClose: () => void;
  onDone: (stateId: string, note: string) => void;
}) {
  const [note, setNote] = useState(state.replyNote || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await markAsReplied(state.contactId, state.campaignId, note);
    setSaving(false);
    if (res.success) onDone(state.id, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-bold text-slate-900">Mark as Replied</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-3">
            Marking <strong>{state.contact?.name || state.contact?.email}</strong> as replied will stop
            further follow-ups and record the reply in their timeline.
          </p>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Reply note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Interested, asked for pricing…"
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export function CampaignContactsTable({ campaign }: { campaign: any }) {
  const [states, setStates]     = useState<any[]>(campaign.states || []);
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const replied  = states.filter(s => s.status === "Replied");
  const others   = states.filter(s => s.status !== "Replied");

  const handleRemove = async (contactId: string) => {
    if (!confirm("Remove this contact from the campaign? They won't receive further emails.")) return;
    setRemoving(contactId);
    await removeContactFromCampaign(contactId, campaign.id);
    setStates(prev => prev.filter(s => s.contact?.id !== contactId));
    setRemoving(null);
  };

  const handleReplied = (stateId: string, note: string) => {
    setStates(prev => prev.map(s =>
      s.id === stateId
        ? { ...s, status: "Replied", repliedAt: new Date().toISOString(), replyNote: note, nextActionDate: null }
        : s
    ));
    setReplyTarget(null);
  };

  const renderRow = (state: any) => (
    <tr key={state.id} className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-3.5">
        <div>
          <p className="text-sm font-semibold text-slate-900">{state.contact?.name || "—"}</p>
          <p className="text-xs text-slate-400">{state.contact?.company || ""}</p>
        </div>
      </td>
      <td className="px-6 py-3.5 text-sm text-slate-600">{state.contact?.email}</td>
      <td className="px-6 py-3.5">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[state.status] ?? STATUS_STYLE.Waiting}`}>
          {state.status === "New" ? "Waiting" : state.status}
        </span>
      </td>
      <td className="px-6 py-3.5 text-sm text-slate-500">
        {state.currentStep > 0 ? `Step ${state.currentStep}` : "Not Started"}
      </td>
      <td className="px-6 py-3.5 text-sm text-slate-500">
        {state.status === "Replied" && state.repliedAt ? (
          <span className="text-emerald-600 font-medium text-xs">
            {new Date(state.repliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : state.status === "New" ? "Send Today" : state.nextActionDate
          ? new Date(state.nextActionDate).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-6 py-3.5 text-sm text-slate-500 max-w-[180px]">
        {state.replyNote
          ? <span className="text-xs text-slate-600 italic truncate block">{state.replyNote}</span>
          : null}
      </td>
      <td className="px-6 py-3.5 text-right">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {state.status !== "Replied" && (
            <button
              onClick={() => setReplyTarget(state)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="Mark as replied"
            >
              <Reply className="w-3 h-3" /> Replied
            </button>
          )}
          <button
            onClick={() => handleRemove(state.contact?.id)}
            disabled={removing === state.contact?.id}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            title="Remove from campaign"
          >
            {removing === state.contact?.id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {replyTarget && (
        <ReplyModal
          state={replyTarget}
          onClose={() => setReplyTarget(null)}
          onDone={handleReplied}
        />
      )}

      {/* Replies section — always show if any replies exist */}
      {replied.length > 0 && (
        <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Replies <span className="ml-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{replied.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Contact", "Email", "Status", "Step", "Replied At", "Note", ""].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {replied.map(renderRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All contacts */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-4">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Enrolled Contacts
          </h2>
          <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
            {states.length} total · {replied.length} replied
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Contact", "Email", "Status", "Step", "Next / Replied At", "Note", ""].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {states.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-200 mb-3" />
                    No contacts enrolled yet.
                  </td>
                </tr>
              ) : (
                [...replied, ...others].map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
