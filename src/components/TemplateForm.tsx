"use client";

import { useState, useRef } from "react";
import { Plus, X, Save, Loader2, Code, Type, Paperclip, ShieldAlert, Image, Eye, Upload } from "lucide-react";
import { createTemplate } from "@/actions/templates";
import { getSpamScore } from "@/lib/spam-score";
import { EmailPreviewModal } from "@/components/EmailPreviewModal";

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

type Attachment = { id: string; name: string; url: string };
type BodyMode = "plain" | "html";

// ── ImagePickerModal ─────────────────────────────────────────────────────────

function ImagePickerModal({
  files,
  onInsert,
  onClose,
}: {
  files: any[];
  onInsert: (tag: string) => void;
  onClose: () => void;
}) {
  const [imageFiles, setImageFiles] = useState<any[]>(
    files.filter(
      (f) =>
        f.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name ?? "")
    )
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.url) {
        const newFile = { id: json.id || Date.now().toString(), name: file.name, url: json.url, mimeType: file.type };
        setImageFiles((prev) => [newFile, ...prev]);
      }
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-600" />
            Insert Image
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload section */}
        <div className="px-6 pt-4 pb-2">
          <label className="text-xs font-semibold text-slate-700 block mb-2">Upload new image</label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="img-upload-input"
            />
            <label
              htmlFor="img-upload-input"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Choose File"}
            </label>
            <span className="text-xs text-slate-400">JPG, PNG, GIF, WebP, SVG</span>
          </div>
        </div>

        <div className="px-6 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-3">Library images — click to insert</p>
          {imageFiles.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">
              Upload an image above to insert it inline.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {imageFiles.map((f) => (
                <button
                  key={f.id ?? f.url}
                  type="button"
                  onClick={() => {
                    onInsert(
                      `<img src="${f.url}" alt="${f.name}" style="max-width:100%;display:block;margin:10px auto;" />`
                    );
                    onClose();
                  }}
                  className="group rounded-xl border border-slate-200 overflow-hidden hover:border-blue-400 transition-all text-left"
                >
                  <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
                  <p className="px-2 py-1.5 text-xs text-slate-600 truncate group-hover:text-blue-600">{f.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AttachmentPicker ─────────────────────────────────────────────────────────

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
            <span
              key={f.id}
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"
            >
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="max-w-[140px] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== f.id))}
                className="ml-0.5 text-blue-400 hover:text-blue-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {files.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No files in library — upload files in the Files tab first.</p>
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
          {available.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── TemplateForm ─────────────────────────────────────────────────────────────

export function TemplateForm({ files = [] }: { files?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bodyMode, setBodyMode] = useState<BodyMode>("plain");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Cold Outreach");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const insert = (snippet: string) => setBody((prev) => prev + snippet);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) return;
    setIsSaving(true);
    const res = await createTemplate({ name, subject, body, category, attachments });
    setIsSaving(false);
    if (!res.success) { alert("Failed to save template."); return; }
    setIsOpen(false);
    setName(""); setSubject(""); setBody(""); setBodyMode("plain");
    setCategory("Cold Outreach"); setAttachments([]);
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white";

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        className="bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer group h-[200px] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <span className="font-semibold text-slate-800 text-sm">New Template</span>
        <span className="text-slate-400 text-xs mt-0.5">Plain text or HTML with live preview</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden col-span-full">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="font-semibold text-slate-900 text-sm">New Email Template</span>
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
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
              <input required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cold Intro Email" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Subject line</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick question for {{name}}" className={inputClass} />
            </div>
          </div>

          {/* Body mode toggle + tag/snippet buttons */}
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
              {bodyMode === "html" && (
                <>
                  {HTML_SNIPPETS.map((s) => (
                    <button key={s.label} type="button" onClick={() => insert(s.tag)}
                      className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-200 transition-colors">{s.label}</button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <Image className="w-3 h-3" /> Insert Image
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          {bodyMode === "plain" ? (
            <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={10}
              placeholder={"Hi {{name}},\n\nI wanted to reach out..."}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none bg-white leading-relaxed" />
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
                  {body ? <div dangerouslySetInnerHTML={{ __html: body }} /> : <p className="text-slate-300 italic">Preview appears as you type…</p>}
                </div>
              </div>
            </div>
          )}

          {/* Preview Email button */}
          {(subject || body) && (
            <button
              type="button"
              onClick={() => setShowEmailPreview(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-2 rounded-xl transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Email
            </button>
          )}

          {/* Live spam score */}
          {subject && body && (() => {
            const spam = getSpamScore(subject, body);
            if (spam.issues.length === 0) return (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <ShieldAlert className="w-3.5 h-3.5" /> Deliverability looks good — no issues detected.
              </div>
            );
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Deliverability check</p>
                <ul className="space-y-0.5">
                  {spam.issues.map((issue, i) => (
                    <li key={i} className={`text-xs flex items-start gap-1.5 ${issue.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
                      <span className="shrink-0">{issue.severity === "error" ? "✕" : "⚠"}</span>{issue.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

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
              Save Template
            </button>
          </div>
        </form>
      </div>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImagePickerModal
          files={files}
          onInsert={insert}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <EmailPreviewModal
          template={{ name: name || "New Template", subject, body }}
          onClose={() => setShowEmailPreview(false)}
        />
      )}
    </>
  );
}
