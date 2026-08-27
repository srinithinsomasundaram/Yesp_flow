"use client";

import { useState } from "react";
import { Users, Trash2, Send, Loader2, Calendar } from "lucide-react";
import { ContactActions } from "@/components/ContactActions";
import { bulkDeleteContacts, bulkAddToCampaign } from "@/actions/contacts";

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";

  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getContactStatusStyle(status: string) {
  switch (status) {
    case "New": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Replied": return "bg-violet-50 text-violet-700 border-violet-200";
    case "Interested": return "bg-teal-50 text-teal-700 border-teal-200";
    case "Not Interested": return "bg-slate-100 text-slate-600 border-slate-200";
    case "Do Not Contact": return "bg-red-50 text-red-700 border-red-200";
    case "Unsubscribed": return "bg-orange-50 text-orange-700 border-orange-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getCampaignStatusStyle(status: string) {
  switch (status) {
    case "New": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Replied": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Bounced": return "bg-red-50 text-red-700 border-red-200";
    case "Completed": return "bg-purple-50 text-purple-700 border-purple-200";
    default: return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

const CONTACT_STATUS_FILTERS = ["All", "New", "Active", "Replied", "Interested", "Not Interested", "Do Not Contact", "Unsubscribed"];

export function ContactsTable({ contacts, campaigns }: { contacts: any[]; campaigns: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCampaignForBulk, setSelectedCampaignForBulk] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredContacts =
    statusFilter === "All"
      ? contacts
      : contacts.filter((c) => c.status === statusFilter);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) {
      setIsProcessing(true);
      await bulkDeleteContacts(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsProcessing(false);
    }
  };

  const handleBulkAddToCampaign = async () => {
    if (selectedIds.size === 0 || !selectedCampaignForBulk) return;
    setIsProcessing(true);
    await bulkAddToCampaign(Array.from(selectedIds), selectedCampaignForBulk);
    setSelectedIds(new Set());
    setSelectedCampaignForBulk("");
    setIsProcessing(false);
    alert("Contacts added to campaign successfully!");
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No contacts found</h3>
        <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
          Import a CSV list or add contacts manually to begin automated outreach.
        </p>
      </div>
    );
  }

  // Group contacts by date added
  const groupMap: Record<string, { sortKey: number; contacts: any[] }> = {};
  for (const contact of filteredContacts) {
    const date = new Date(contact.createdAt);
    const label = formatDateLabel(date);
    if (!groupMap[label]) {
      groupMap[label] = { sortKey: -date.getTime(), contacts: [] };
    }
    groupMap[label].contacts.push(contact);
  }
  const groups = Object.entries(groupMap).sort((a, b) => a[1].sortKey - b[1].sortKey);

  return (
    <div className="relative space-y-4">
      {/* Status filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500">Filter by status:</span>
        {CONTACT_STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Floating Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-blue-500 shadow-2xl px-6 py-3 rounded-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <span className="font-bold text-white text-xs font-mono bg-blue-600 px-2.5 py-1 rounded-lg border border-blue-400">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-3">
            <select
              value={selectedCampaignForBulk}
              onChange={(e) => setSelectedCampaignForBulk(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
              disabled={isProcessing}
            >
              <option value="">Add to Campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkAddToCampaign}
              disabled={isProcessing || !selectedCampaignForBulk}
              className="btn-primary text-xs px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{" "}
              Assign
            </button>
            <div className="w-px h-5 bg-white/20" />
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Global select-all header */}
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select All ({filteredContacts.length})
          </span>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No contacts match this filter.
          </div>
        )}

        {groups.map(([label, { contacts: groupContacts }]) => (
          <div key={label} className="space-y-2">
            {/* Date partition header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 tracking-wide">{label}</span>
                <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                  {groupContacts.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {groupContacts.map((contact) => {
                const state = contact.states?.[0];
                const isSelected = selectedIds.has(contact.id);
                const displayName =
                  contact.name ||
                  [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                  contact.email;
                const initials = displayName.substring(0, 2).toUpperCase();

                return (
                  <div
                    key={contact.id}
                    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors ${isSelected ? "border-blue-400 bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(contact.id)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
                          <ContactActions contact={contact} />
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate">{contact.email}</p>
                        {contact.company && (
                          <p className="text-xs text-slate-400 truncate">{contact.company}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {contact.status && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getContactStatusStyle(contact.status)}`}>
                              {contact.status}
                            </span>
                          )}
                          {state && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getCampaignStatusStyle(state.status)}`}>
                              {state.status === "New" ? "Not Sent" : state.status}
                            </span>
                          )}
                          {state?.campaign?.name && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                              {state.campaign.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-x-auto shadow-sm border border-slate-200 bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10 rounded-tl-2xl" />
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Job Title</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Contact Status</th>
                    <th className="px-4 py-3">Action Status</th>
                    <th className="px-4 py-3">Next Action</th>
                    <th className="px-4 py-3 rounded-tr-2xl">Added At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {groupContacts.map((contact) => {
                    const state = contact.states?.[0];
                    const isSelected = selectedIds.has(contact.id);
                    const displayName =
                      contact.name ||
                      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                      contact.email;
                    const initials = displayName.substring(0, 2).toUpperCase();
                    const addedAt = new Date(contact.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={contact.id}
                        className={`hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50/70" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(contact.id)}
                            className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{displayName}</div>
                              <div className="text-xs text-slate-500 font-mono">{contact.email}</div>
                              {contact.company && (
                                <div className="text-xs text-slate-400">{contact.company}</div>
                              )}
                              {Array.isArray(contact.tags) && contact.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {contact.tags.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full font-medium">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {contact.jobTitle || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {state?.campaign?.name ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                              {state.campaign.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {contact.status ? (
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getContactStatusStyle(
                                contact.status
                              )}`}
                            >
                              {contact.status}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {state ? (
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getCampaignStatusStyle(
                                state.status
                              )}`}
                            >
                              {state.status === "New" ? "Not Sent" : state.status}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {state?.status === "Replied" ? (
                            <div>
                              <span className="text-emerald-600 font-semibold">
                                {state.repliedAt
                                  ? new Date(state.repliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                  : "Replied"}
                              </span>
                              {state.replyNote && (
                                <p className="text-xs text-slate-500 italic mt-0.5 max-w-[140px] truncate">{state.replyNote}</p>
                              )}
                            </div>
                          ) : state?.status === "New"
                            ? "Today"
                            : state?.nextActionDate
                            ? new Date(state.nextActionDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">
                          {addedAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ContactActions contact={contact} />
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
    </div>
  );
}
