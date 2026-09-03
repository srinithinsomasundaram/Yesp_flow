"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2, Trash2, Eye, MoreVertical, ArrowDown } from "lucide-react";
import { addCampaignStep, updateCampaignStep, removeCampaignStep } from "@/actions/campaigns";
import { useRouter } from "next/navigation";
import { EmailPreviewModal } from "@/components/EmailPreviewModal";
import type { CampaignStep } from "@/types/db";

const DELAY_UNITS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
  { label: "Business Days", value: "business_days" },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function delayLabel(amount: number, unit: string): string {
  const unitObj = DELAY_UNITS.find((u) => u.value === unit);
  const unitLabel = unitObj ? unitObj.label.toLowerCase() : "days";
  return `Wait ${amount} ${amount === 1 ? unitLabel.replace(/s$/, "") : unitLabel}`;
}

interface StepMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

function StepMenu({ onEdit, onDelete }: StepMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[110px]">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const selectClass =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium";

export function CampaignFlowEditor({
  campaign,
  templates,
}: {
  campaign: any;
  templates: any[];
  files?: any[];
}) {
  const router = useRouter();
  const steps: CampaignStep[] = campaign.steps || [];

  // Add step state
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newDelay, setNewDelay] = useState(1);
  const [newDelayUnit, setNewDelayUnit] = useState("days");
  const [isSaving, setIsSaving] = useState(false);

  // Edit step state (inline)
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ templateId: string; delayDays: number; delayUnit: string }>({
    templateId: "",
    delayDays: 1,
    delayUnit: "days",
  });

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<{ name: string; subject: string; body: string } | null>(null);

  const openEdit = (step: CampaignStep) => {
    setEditingStepId(step.id);
    setEditForm({
      templateId: step.templateId ?? "",
      delayDays: step.delayDays ?? 1,
      delayUnit: step.delayUnit || "days",
    });
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateId) return;
    setIsSaving(true);
    await addCampaignStep(campaign.id, newTemplateId, newDelay, steps.length, newDelayUnit);
    setIsSaving(false);
    setIsAdding(false);
    setNewTemplateId("");
    setNewDelay(1);
    setNewDelayUnit("days");
    router.refresh();
  };

  const handleUpdateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStepId) return;
    setIsSaving(true);
    await updateCampaignStep(editingStepId, editForm.templateId, editForm.delayDays, editForm.delayUnit);
    setIsSaving(false);
    setEditingStepId(null);
    router.refresh();
  };

  const handleDeleteStep = async (stepId: string) => {
    if (
      confirm(
        "Delete this step? Contacts waiting at this step will be advanced to the next step, or marked Completed if there is none."
      )
    ) {
      await removeCampaignStep(stepId, campaign.id);
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            Sequence Builder
          </h4>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Configure step cadence and message templates.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-2xl mx-auto py-4 gap-0">
        {steps.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="mb-4 font-medium text-sm">No sequence steps defined yet.</p>
          </div>
        ) : (
          steps.map((step: CampaignStep, idx: number) => {
            const tpl = step.template;
            const bodyText = tpl?.body ? stripHtml(tpl.body) : "";
            const bodySnippet = bodyText.length > 100 ? bodyText.slice(0, 100) + "…" : bodyText;
            const isEditingThis = editingStepId === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center w-full">
                {idx > 0 && (
                  <div className="flex flex-col items-center my-2 text-slate-400">
                    <div className="h-5 w-0.5 bg-blue-600" />
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold my-1 shadow-sm">
                      {delayLabel(step.delayDays, step.delayUnit || "days")}
                    </div>
                    <div className="h-5 w-0.5 bg-blue-600" />
                    <ArrowDown className="w-4 h-4 text-blue-600 -mt-1" />
                  </div>
                )}

                {/* Step card */}
                <div className="w-full border border-slate-200 hover:border-blue-400 shadow-sm rounded-2xl overflow-hidden transition-all duration-200">
                  <div className="flex items-center gap-4 p-5">
                    {/* Step number badge */}
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {tpl?.name || "Step Template"}
                      </p>
                      {tpl?.subject && (
                        <p className="text-xs italic text-slate-500 mt-0.5 truncate">
                          &ldquo;{tpl.subject}&rdquo;
                        </p>
                      )}
                      {bodySnippet && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {bodySnippet}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tpl && (
                        <button
                          onClick={() =>
                            setPreviewTemplate({
                              name: tpl.name,
                              subject: tpl.subject || "",
                              body: tpl.body || "",
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview email"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <StepMenu onEdit={() => openEdit(step)} onDelete={() => handleDeleteStep(step.id)} />
                    </div>
                  </div>

                  {/* Inline edit panel */}
                  {isEditingThis && (
                    <form
                      onSubmit={handleUpdateStep}
                      className="border-t border-slate-200 bg-slate-50 p-5 space-y-4"
                    >
                      <p className="text-xs font-bold text-slate-700">Edit Step {idx + 1}</p>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Template</label>
                        <select
                          required
                          value={editForm.templateId}
                          onChange={(e) => setEditForm({ ...editForm, templateId: e.target.value })}
                          className={selectClass}
                        >
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {step.stepNumber > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800">Delay before sending</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              required
                              value={editForm.delayDays}
                              onChange={(e) =>
                                setEditForm({ ...editForm, delayDays: parseInt(e.target.value) || 1 })
                              }
                              className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-mono font-bold"
                            />
                            <select
                              value={editForm.delayUnit}
                              onChange={(e) => setEditForm({ ...editForm, delayUnit: e.target.value })}
                              className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium"
                            >
                              {DELAY_UNITS.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-slate-500 text-xs font-medium">after prev step</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="btn-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStepId(null)}
                          className="text-xs px-4 py-2 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Add Step dashed button */}
        <div className="flex flex-col items-center w-full mt-4">
          {steps.length > 0 && (
            <div className="h-6 w-0.5 bg-slate-200 mb-0" />
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="w-full border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>
      </div>

      {/* Add Step Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Add Step to Sequence</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStep} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Select Template</label>
                <select
                  required
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Choose a template…
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {steps.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Delay before sending</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={newDelay}
                      onChange={(e) => setNewDelay(parseInt(e.target.value) || 1)}
                      className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-mono font-bold"
                    />
                    <select
                      value={newDelayUnit}
                      onChange={(e) => setNewDelayUnit(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium"
                    >
                      {DELAY_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-600 text-xs font-medium">after prev step</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Add Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      <EmailPreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
    </div>
  );
}
