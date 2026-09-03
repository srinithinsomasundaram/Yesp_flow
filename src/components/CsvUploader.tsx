"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, Loader2, X, FileSpreadsheet, Sparkles, CheckCircle2 } from "lucide-react";
import { importContacts } from "@/actions/contacts";

export function CsvUploader({ campaigns }: { campaigns: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<"new_campaign" | "existing_campaign" | "contacts_only">("contacts_only");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        
        const contactsData = rows.map((row) => {
          const emailKey = Object.keys(row).find((k) => k.toLowerCase().includes("email"));
          const nameKey = Object.keys(row).find((k) => k.toLowerCase().includes("name"));
          const companyKey = Object.keys(row).find((k) => k.toLowerCase().includes("company"));

          return {
            email: emailKey ? row[emailKey] : "",
            name: nameKey ? row[nameKey] : "",
            company: companyKey ? row[companyKey] : "",
          };
        }).filter(c => c.email);

        setParsedContacts(contactsData);
        setStep(2);
        setIsProcessing(false);
      },
      error: () => {
        alert("Failed to parse CSV file.");
        setIsProcessing(false);
      }
    });
  };

  const handleImport = async () => {
    setIsProcessing(true);
    const campId = selectedAction === "existing_campaign" && selectedCampaignId
      ? selectedCampaignId
      : undefined;

    try {
      const res = await importContacts(parsedContacts, campId);
      if (res.success) {
        alert(`Successfully imported ${res.count} of ${parsedContacts.length} contacts!`);
        router.refresh();
      } else {
        alert(`Import failed: ${(res as any).error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Import error: ${err?.message || "Unknown error"}`);
    }

    setIsProcessing(false);
    reset();
  };

  const reset = () => {
    setIsOpen(false);
    setStep(1);
    setParsedContacts([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
      >
        <Upload className="w-4 h-4" /> Import CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Import Contacts CSV</h3>
              </div>
              <button onClick={reset} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {step === 1 ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 text-blue-600">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p className="text-slate-900 font-extrabold mb-1">Upload a CSV file</p>
                  <p className="text-sm text-slate-600 mb-6 font-medium">We'll automatically detect Email, Name, and Company columns.</p>
                  
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="btn-secondary px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mx-auto w-full max-w-xs disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select File"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 text-center">
                    <span className="text-2xl font-black">{parsedContacts.length}</span>
                    <p className="text-sm font-bold mt-1">contacts detected in CSV</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-extrabold text-slate-900">What do you want to do?</p>
                    
                    <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 font-medium">
                      <input 
                        type="radio" 
                        name="import_action" 
                        className="mt-1 accent-blue-600"
                        checked={selectedAction === "existing_campaign"}
                        onChange={() => setSelectedAction("existing_campaign")}
                      />
                      <div>
                        <p className="font-bold text-slate-900">Add to existing campaign</p>
                        <p className="text-xs text-slate-600 mt-0.5">Start sending emails to these contacts immediately.</p>
                        
                        {selectedAction === "existing_campaign" && (
                          <div className="mt-3">
                            <select 
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-900 font-semibold"
                              value={selectedCampaignId}
                              onChange={e => setSelectedCampaignId(e.target.value)}
                            >
                              <option value="" disabled>Select a campaign...</option>
                              {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 font-medium">
                      <input 
                        type="radio" 
                        name="import_action"
                        className="accent-blue-600"
                        checked={selectedAction === "new_campaign"}
                        onChange={() => setSelectedAction("new_campaign")}
                      />
                      <div>
                        <p className="font-bold text-slate-900">Create new campaign</p>
                        <p className="text-xs text-slate-600 mt-0.5">We will import them and you can create a campaign after.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 font-medium">
                      <input 
                        type="radio" 
                        name="import_action"
                        className="accent-blue-600"
                        checked={selectedAction === "contacts_only"}
                        onChange={() => setSelectedAction("contacts_only")}
                      />
                      <div>
                        <p className="font-bold text-slate-900">Add as contacts only</p>
                        <p className="text-xs text-slate-600 mt-0.5">Just add them to the database without assigning a campaign.</p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200">
                    <button 
                      onClick={handleImport}
                      disabled={isProcessing || (selectedAction === "existing_campaign" && !selectedCampaignId)}
                      className="btn-primary text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Import"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
