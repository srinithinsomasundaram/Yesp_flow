"use client";

import { useState } from "react";
import { Edit2, Trash2, X, Save, Loader2, FileText, Code, Type, Copy, Paperclip, Eye, ShieldAlert } from "lucide-react";
import { updateTemplate, deleteTemplate, duplicateTemplate } from "@/actions/templates";
import { getSpamScore } from "@/lib/spam-score";

const MERGE_TAGS = ["{{name}}", "{{firstName}}", "{{company}}", "{{email}}", "{{jobTitle}}", "{{linkedinUrl}}"];
const HTML_SNIPPETS = [
  { label: "Bold", tag: "<b>text</b>" },
  { label: "Link", tag: '<a href="https://example.com" style="color:#2563eb;">Click Here</a>' },
  { label: "Button", tag: '<a href="https://example.com" style="background:#2563eb;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;display:inline-block;">CTA</a>' },
  { label: "BR", tag: "<br />" },
];

const CATEGORIES = [
  "Introduction", "Cold Outreach", "Follow-up", "Product Pitch",
  "Meeting Request", "Proposal", "Final Follow-up", "Custom",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Introduction": "bg-blue-50 text-blue-700 border-blue-200",
  "Cold Outreach": "bg-violet-50 text-violet-700 border-violet-200",
  "Follow-up": "bg-amber-50 text-amber-700 border-amber-200",
  "Product Pitch": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Meeting Request": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Proposal": "bg-pink-50 text-pink-700 border-pink-200",
  "Final Follow-up": "bg-red-50 text-red-700 border-red-200",
  "Custom": "bg-slate-100 text-slate-600 border-slate-200",
};

type Attachment = { id: string; name: string; url: string };
type BodyMode = "plain" | "html";

function AttachmentPicker({
  files,
  selected,
  onChange,
}: {
  files: any[];
  selected: Attachment[];
  onChange: (v: Attachment[]) => void;
}) {
  const available = files.filter((f) => !selected.some((s) => s.id === f.id));
  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((f) => (
            <span key={f.id} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="max-w-[140px] truncate">{f.name}</span>
              <button type="button" onClick={() => onChange(selected.filter((s) => s.id !== f.id))}
                className="ml-0.5 text-blue-400 hover:text-blue-700"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      {files.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No files in library — upload files in the Files tab.</p>
      ) : available.length === 0 ? (
        <p className="text-xs text-slate-400 italic">All library files attached.</p>
      ) : (
        <select
          onChange={(e) => {
            const file = files.find((f) => f.id === e.target.value);
            if (file) onChange([...selected, { id: file.id, name: file.name, url: file.url }]);
            e.target.value = "";
          }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
        >
          <option value="">Attach a file from library…</option>
          {available.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}
    </div>
  );
}

export function TemplateCard({ template, files = [] }: { template: any; files?: any[] }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [name, setName] = useState<string>(template.name || "");
  const [subject, setSubject] = useState<string>(template.subject || "");
  const [body, setBody] = useState<string>(template.body || "");
  const [category, setCategory] = useState<string>(template.category || "Custom");
  const [attachments, setAttachments] = useState<Attachment[]>(template.attachments || []);
  const [bodyMode, setBodyMode] = useState<BodyMode>(
    /<[a-z][\s\S]*>/i.test(template.body || "") ? "html" : "plain"
  );

  const insert = (snippet: string) => setBody((prev) => prev + snippet);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateTemplate(template.id, { name, subject, body, category, attachments });
    setIsSaving(false);
    if (!res.success) { alert("Failed to update template."); return; }
    setIsEditOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${template.name}"?`)) return;
    const res = await deleteTemplate(template.id);
    if (!res.success) alert(res.error || "Failed to delete template.");
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDuplicating(true);
    const res = await duplicateTemplate(template.id);
    setIsDuplicating(false);
    if (!res.success) alert("Failed to duplicate template.");
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(template.body || "");
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS["Custom"];
  const savedAttachments: Attachment[] = template.attachments || [];
  const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white";
  const spam = getSpamScore(template.subject || "", template.body || "");
  const spamColor = spam.score === 0 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : spam.score < 30 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <>
      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[200px] shadow-sm group relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 shrink-0">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm truncate">{template.name}</h3>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
            <button onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }} title="Preview"
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDuplicate} disabled={isDuplicating} title="Duplicate"
              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50">
              {isDuplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setIsEditOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {template.category && (
          <div className="mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
              {template.category}
            </span>
          </div>
        )}

        <p className="text-xs text-slate-500 mb-2 truncate">
          <span className="font-medium text-slate-600">Subject:</span> {template.subject}
        </p>

        <div className="flex-1 overflow-hidden relative">
          {isHtml ? (
            <div className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: template.body }} />
          ) : (
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{template.body}</p>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedAttachments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Paperclip className="w-3 h-3" /> {savedAttachments.length}
              </span>
            )}
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${spamColor}`}>
              <ShieldAlert className="w-2.5 h-2.5" />
              {spam.score === 0 ? "Clean" : spam.score < 30 ? "Low Risk" : "Spam Risk"}
            </span>
          </div>
          <span className={`flex items-center gap-1 text-xs ${isHtml ? "text-blue-600" : "text-slate-400"}`}>
            {isHtml ? <><Code className="w-3 h-3" /> HTML</> : <><Type className="w-3 h-3" /> Plain</>}
          </span>
        </div>
      </div>

      {/* Preview modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <span className="font-semibold text-slate-900 text-sm">Email Preview</span>
                <span className="text-xs text-slate-400 ml-2">— {template.name}</span>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spam score panel */}
            {spam.issues.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-100 bg-amber-50/60">
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Deliverability Check
                </p>
                <ul className="space-y-1">
                  {spam.issues.map((issue, i) => (
                    <li key={i} className={`text-xs flex items-start gap-1.5 ${issue.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
                      <span className="shrink-0 mt-0.5">{issue.severity === "error" ? "✕" : "⚠"}</span>
                      {issue.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subject line preview */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 mb-0.5">Subject</p>
              <p className="text-sm font-semibold text-slate-900">{template.subject}</p>
            </div>

            {/* Body preview */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg mx-auto shadow-sm">
                {isHtml
                  ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: template.body }} />
                  : <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{template.body}</p>
                }
                {/* Unsubscribe footer preview */}
                <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                  You received this email because you are in our outreach list.{" "}
                  <span className="underline text-slate-500 cursor-pointer">Unsubscribe</span>
                  <br /><span className="text-slate-300 text-[10px]">(Auto-added by YESP Flow)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-900 text-sm">Edit Template</span>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              {/* Category + Name + Subject */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Template name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Subject line</label>
                  <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Body mode toggle */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                  <button type="button" onClick={() => setBodyMode("plain")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${bodyMode === "plain" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                    <Type className="w-3.5 h-3.5" /> Plain Text
                  </button>
                  <button type="button" onClick={() => setBodyMode("html")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${bodyMode === "html" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                    <Code className="w-3.5 h-3.5" /> HTML
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400">Merge:</span>
                  {MERGE_TAGS.map((v) => (
                    <button key={v} type="button" onClick={() => insert(v)}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md hover:bg-blue-100 font-mono transition-colors">{v}</button>
                  ))}
                  {bodyMode === "html" && HTML_SNIPPETS.map((s) => (
                    <button key={s.label} type="button" onClick={() => insert(s.tag)}
                      className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-200 transition-colors">{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Body */}
              {bodyMode === "plain" ? (
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none bg-white leading-relaxed" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">HTML Code</label>
                    <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none font-mono bg-slate-50 leading-relaxed" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Live Preview</label>
                    <div className="w-full h-[248px] border border-slate-200 rounded-xl bg-white p-4 overflow-y-auto text-sm text-slate-800 leading-relaxed">
                      {body ? <div dangerouslySetInnerHTML={{ __html: body }} /> : <p className="text-slate-300 italic">Preview appears here…</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </label>
                <AttachmentPicker files={files} selected={attachments} onChange={setAttachments} />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="submit" disabled={isSaving}
                  className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
