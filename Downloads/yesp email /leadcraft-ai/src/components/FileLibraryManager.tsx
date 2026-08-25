"use client";

import { useState, useRef, useCallback } from "react";
import {
  Paperclip,
  Trash2,
  ExternalLink,
  Loader2,
  File,
  FileText,
  FileImage,
  Upload,
  Copy,
  Check,
} from "lucide-react";
import { addFile, deleteFile } from "@/actions/files";

function formatBytes(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeLabel(mimeType: string | null) {
  if (!mimeType) return "File";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOCX";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "XLSX";
  if (mimeType === "text/csv") return "CSV";
  if (mimeType === "text/plain") return "TXT";
  return "File";
}

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document"))
    return FileText;
  if (mimeType.startsWith("image/")) return FileImage;
  return File;
}

function getMimeColor(mimeType: string | null) {
  if (!mimeType) return "bg-slate-100 text-slate-600 border-slate-200";
  if (mimeType.includes("pdf")) return "bg-red-50 text-red-700 border-red-200";
  if (mimeType.startsWith("image/")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (mimeType.includes("excel") || mimeType.includes("sheet"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy URL"
      className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

type UploadingFile = {
  name: string;
  progress: "uploading" | "saving" | "done" | "error";
  error?: string;
};

export function FileLibraryManager({ files }: { files: any[] }) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const entry: UploadingFile = { name: file.name, progress: "uploading" };
    setUploading((prev) => [...prev, entry]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || json.error) {
        setUploading((prev) =>
          prev.map((u) =>
            u.name === file.name ? { ...u, progress: "error", error: json.error ?? "Upload failed" } : u
          )
        );
        return;
      }

      setUploading((prev) =>
        prev.map((u) => (u.name === file.name ? { ...u, progress: "saving" } : u))
      );

      await addFile({
        name: file.name,
        originalName: file.name,
        url: json.url,
        size: file.size,
        mimeType: file.type || undefined,
        storagePath: json.storagePath,
      });

      setUploading((prev) => prev.filter((u) => u.name !== file.name));
    } catch (err: any) {
      setUploading((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, progress: "error", error: err.message ?? "Upload failed" } : u
        )
      );
    }
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = async (id: string, storagePath?: string | null) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    await deleteFile(id, storagePath);
  };

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center
          ${isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
            isDragging ? "bg-blue-100 border-blue-200" : "bg-slate-100 border-slate-200"
          }`}>
            <Upload className={`w-6 h-6 ${isDragging ? "text-blue-600" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isDragging ? "Drop files here" : "Upload files"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag and drop, or click to browse. PDF, images, docs, and more. Up to 50 MB.
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress indicators */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div
              key={u.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                u.progress === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              {u.progress !== "error" ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <span className="text-red-500 font-bold shrink-0">!</span>
              )}
              <span className="font-medium truncate flex-1">{u.name}</span>
              <span className="text-xs shrink-0">
                {u.progress === "uploading" && "Uploading…"}
                {u.progress === "saving" && "Saving…"}
                {u.progress === "error" && (u.error ?? "Error")}
              </span>
              {u.progress === "error" && (
                <button
                  onClick={() =>
                    setUploading((prev) => prev.filter((x) => x.name !== u.name))
                  }
                  className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File grid */}
      {files.length === 0 && uploading.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No files yet</p>
          <p className="text-sm text-slate-400 mt-1">Upload your first file above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => {
            const Icon = getMimeIcon(file.mimeType);
            const size = formatBytes(file.size);
            return (
              <div
                key={file.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {size && <span className="mr-2">{size}</span>}
                        {new Date(file.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getMimeColor(
                      file.mimeType
                    )}`}
                  >
                    {getMimeLabel(file.mimeType)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-slate-600 flex-1 justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                  <CopyButton text={file.url} />
                  <button
                    onClick={() => handleDelete(file.id, file.storagePath)}
                    className="text-sm border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-50 flex items-center gap-1.5 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
