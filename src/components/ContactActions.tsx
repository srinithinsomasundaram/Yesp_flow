"use client";

import { useState, useRef } from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Ban,
  BellOff,
  Tag,
} from "lucide-react";
import {
  deleteContact,
  updateContact,
  markDNC,
  unsubscribeContact,
  updateContactStatus,
} from "@/actions/contacts";

const CONTACT_STATUSES = [
  "New",
  "Active",
  "Replied",
  "Interested",
  "Not Interested",
  "Do Not Contact",
  "Unsubscribed",
];

export function ContactActions({ contact }: { contact: any }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Edit Form State
  const [name, setName] = useState(contact.name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [company, setCompany] = useState(contact.company || "");
  const [jobTitle, setJobTitle] = useState(contact.jobTitle || "");
  const [selectedStatus, setSelectedStatus] = useState(contact.status || "New");

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(contact.id);
    }
    setIsOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateContact(contact.id, { name, email, company, jobTitle });
    setIsSaving(false);
    setIsEditModalOpen(false);
  };

  const handleMarkDNC = async () => {
    setIsOpen(false);
    if (confirm("Mark this contact as Do Not Contact? They will be skipped in all campaigns.")) {
      await markDNC(contact.id);
    }
  };

  const handleUnsubscribe = async () => {
    setIsOpen(false);
    if (confirm("Unsubscribe this contact? They will not receive any further emails.")) {
      await unsubscribeContact(contact.id);
    }
  };

  const handleStatusChange = async () => {
    setIsSaving(true);
    await updateContactStatus(contact.id, selectedStatus);
    setIsSaving(false);
    setIsStatusModalOpen(false);
  };

  const inputClass =
    "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium";

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
          <div
            style={{ top: dropPos.top, right: dropPos.right }}
            className="fixed z-[999] w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 animate-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => { setIsOpen(false); setIsViewModalOpen(true); }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-600" /> View Details
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsEditModalOpen(true); }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4 text-amber-500" /> Edit Contact
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsStatusModalOpen(true); }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <Tag className="w-4 h-4 text-violet-500" /> Change Status
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button
              onClick={handleUnsubscribe}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
            >
              <BellOff className="w-4 h-4" /> Unsubscribe
            </button>
            <button
              onClick={handleMarkDNC}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Ban className="w-4 h-4" /> Mark DNC
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Contact
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">Edit Contact</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Job Title</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Head of Growth"
                />
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xs flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">Change Status</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Select Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={inputClass}
                >
                  {CONTACT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-xs text-slate-500 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={isSaving}
                  className="btn-primary text-xs px-5 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">Contact Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Name", value: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "-" },
                { label: "Email", value: contact.email, mono: true },
                { label: "Company", value: contact.company || "-" },
                { label: "Job Title", value: contact.jobTitle || "-" },
                { label: "Phone", value: contact.phone || "-" },
                { label: "Industry", value: contact.industry || "-" },
                { label: "City", value: contact.city || "-" },
                { label: "Timezone", value: contact.timezone || "-" },
                { label: "Status", value: contact.status || "-" },
                { label: "Added On", value: new Date(contact.createdAt).toLocaleDateString(), mono: true },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs font-semibold text-slate-400 uppercase">{field.label}</p>
                  <p className={`text-sm font-semibold text-slate-900 mt-0.5 ${field.mono ? "font-mono text-xs" : ""}`}>
                    {field.value}
                  </p>
                </div>
              ))}
              {(contact.isDNC || contact.isUnsubscribed) && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {contact.isDNC && (
                    <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      DNC
                    </span>
                  )}
                  {contact.isUnsubscribed && (
                    <span className="text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                      Unsubscribed
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
