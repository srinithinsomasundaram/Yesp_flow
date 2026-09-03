"use client";

import { X } from "lucide-react";

interface TemplatePreview {
  name: string;
  subject: string;
  body: string;
}

interface EmailPreviewModalProps {
  template: TemplatePreview | null;
  onClose: () => void;
}

function isHtml(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}

export function EmailPreviewModal({ template, onClose }: EmailPreviewModalProps) {
  if (!template) return null;

  const hasHtml = isHtml(template.body);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Email Preview</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{template.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject bar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Subject: </span>
          <span className="text-sm text-slate-800 font-medium">{template.subject}</span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {hasHtml ? (
            <div
              className="text-sm text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: template.body }}
            />
          ) : (
            <pre className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {template.body}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
