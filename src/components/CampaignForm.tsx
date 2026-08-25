"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { createCampaign } from "@/actions/campaigns";
export function CampaignForm({ templates }: { templates: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [steps, setSteps] = useState<{ templateId: string; delayDays: number }[]>([
    { templateId: "", delayDays: 0 } // Initial email step
  ]);

  const handleAddStep = () => {
    setSteps([...steps, { templateId: "", delayDays: 2 }]); // Default 2 day follow-up
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || steps.some(s => !s.templateId)) return;
    
    setIsSaving(true);
    await createCampaign({ name, dailyLimit, steps });
    setIsSaving(false);
    setIsOpen(false);
    
    // Reset form
    setName("");
    setDailyLimit(200);
    setSteps([{ templateId: "", delayDays: 0 }]);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs"
      >
        <Plus className="w-4 h-4" /> New Campaign
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-extrabold text-base text-slate-900">Create New Campaign</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Campaign Name</label>
              <input 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Expo Outreach" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Daily Send Limit</label>
              <input 
                required
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 text-xs text-slate-900 outline-none font-mono font-medium"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="font-extrabold text-slate-900 text-sm">Email Sequence Workflow</h4>
            
            {steps.map((step, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-center">
                <div className="w-24 text-xs font-bold text-slate-700">
                  {index === 0 ? "Initial Email" : `Follow-up #${index}`}
                </div>
                
                {index > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Wait</span>
                    <input 
                      type="number" 
                      min="1"
                      value={step.delayDays}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[index].delayDays = Number(e.target.value);
                        setSteps(newSteps);
                      }}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold"
                    />
                    <span className="text-xs font-semibold text-slate-600">days</span>
                  </div>
                )}

                <select
                  required
                  value={step.templateId}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[index].templateId = e.target.value;
                    setSteps(newSteps);
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-900 font-semibold focus:border-blue-600"
                >
                  <option value="" disabled>Select Template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddStep}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Follow-up Step
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button 
              type="submit" 
              disabled={isSaving}
              className="btn-primary text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Launch Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
