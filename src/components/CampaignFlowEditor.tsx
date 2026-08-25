"use client";

import { useState } from "react";
import { Plus, X, ArrowDown, Save, Loader2, Trash2 } from "lucide-react";
import { addCampaignStep, updateCampaignStep, removeCampaignStep } from "@/actions/campaigns";
import { useRouter } from "next/navigation";

const DELAY_UNITS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
  { label: "Business Days", value: "business_days" },
];

function delayLabel(amount: number, unit: string) {
  const unitObj = DELAY_UNITS.find((u) => u.value === unit);
  const unitLabel = unitObj ? unitObj.label.toLowerCase() : "days";
  return `Wait ${amount} ${amount === 1 ? unitLabel.replace(/s$/, "") : unitLabel}`;
}

export function CampaignFlowEditor({ campaign, templates }: { campaign: any; templates: any[] }) {
  const router = useRouter();
  const steps = campaign.steps || [];

  // State for Add Modal
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newDelay, setNewDelay] = useState(1);
  const [newDelayUnit, setNewDelayUnit] = useState("days");
  const [isSaving, setIsSaving] = useState(false);

  // State for Edit
  const [editingStep, setEditingStep] = useState<any>(null);

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
    if (!editingStep) return;
    setIsSaving(true);
    await updateCampaignStep(
      editingStep.id,
      editingStep.templateId,
      editingStep.delayDays,
      editingStep.delayUnit || "days"
    );
    setIsSaving(false);
    setEditingStep(null);
    router.refresh();
  };

  const handleDeleteStep = async (stepId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this step? Future steps will not be re-numbered automatically in the MVP."
      )
    ) {
      await removeCampaignStep(stepId, campaign.id);
      router.refresh();
    }
  };

  const selectClass =
    "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium";

  return (
    <div className="glass-card-pro rounded-2xl p-8 shadow-sm border border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" /> Sequence Builder
          </h4>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Configure step cadence and message templates.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Sequence Step
        </button>
      </div>

      <div className="flex flex-col items-center max-w-xl mx-auto py-4">
        {steps.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="mb-4 font-medium text-sm">No sequence steps defined yet.</p>
          </div>
        ) : (
          steps.map((step: any, idx: number) => (
            <div key={step.id} className="flex flex-col items-center w-full relative">
              {idx > 0 && (
                <div className="flex flex-col items-center my-3 text-slate-400">
                  <div className="h-6 w-0.5 bg-blue-600" />
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1 rounded-full text-xs font-semibold my-1 shadow-sm flex items-center gap-1.5">
                    {delayLabel(step.delayDays, step.delayUnit || "days")}
                  </div>
                  <div className="h-6 w-0.5 bg-blue-600" />
                  <ArrowDown className="w-4 h-4 text-blue-600 -mt-1 animate-bounce" />
                </div>
              )}

              {/* Step Node */}
              <div className="bg-white w-full border border-slate-200 hover:border-blue-500 shadow-md rounded-2xl p-5 flex items-center justify-between group transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm border border-blue-700 shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {step.template?.name || "Step Template"}
                    </h4>
                    <p className="text-xs text-slate-600 font-mono mt-0.5 truncate max-w-[240px]">
                      Subject: &quot;{step.template?.subject || "No subject"}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingStep({ ...step, delayUnit: step.delayUnit || "days" })}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Step Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Add Step to Flow</h3>
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
                    Choose a template...
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

      {/* Edit Step Modal */}
      {editingStep && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">
                Edit Step #{editingStep.stepNumber + 1}
              </h3>
              <button
                onClick={() => setEditingStep(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStep} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Select Template</label>
                <select
                  required
                  value={editingStep.templateId}
                  onChange={(e) => setEditingStep({ ...editingStep, templateId: e.target.value })}
                  className={selectClass}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {editingStep.stepNumber > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Delay before sending</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingStep.delayDays}
                      onChange={(e) =>
                        setEditingStep({ ...editingStep, delayDays: parseInt(e.target.value) || 1 })
                      }
                      className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-mono font-bold"
                    />
                    <select
                      value={editingStep.delayUnit || "days"}
                      onChange={(e) =>
                        setEditingStep({ ...editingStep, delayUnit: e.target.value })
                      }
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
