"use client";

import { useState, useRef } from "react";
import { MoreHorizontal, Eye, Edit, Trash2, X, Save, Loader2 } from "lucide-react";
import { deleteCampaign, updateCampaign } from "@/actions/campaigns";
import Link from "next/link";

export function CampaignActions({ campaign }: { campaign: any }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(campaign.name || "");
  const [dailyLimit, setDailyLimit] = useState(campaign.dailyLimit || 200);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen(true);
  };

  const handleDelete = async () => {
    setIsOpen(false);
    if (!confirm(`Delete campaign "${campaign.name}"? This removes all contact enrollments too.`)) return;
    await deleteCampaign(campaign.id);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateCampaign(campaign.id, { name, dailyLimit: parseInt(dailyLimit.toString(), 10) });
    setIsSaving(false);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown — fixed so it escapes overflow clipping */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
          <div
            style={{ top: dropPos.top, right: dropPos.right }}
            className="fixed z-[999] w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 animate-in zoom-in-95 duration-150"
          >
            <Link
              href={`/campaigns/${campaign.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View Flow
            </Link>
            <button
              onClick={() => { setIsOpen(false); setIsEditModalOpen(true); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Campaign
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-slate-900">Edit Campaign</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Campaign Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Daily Send Limit</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 outline-none font-mono"
                />
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs px-5 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
