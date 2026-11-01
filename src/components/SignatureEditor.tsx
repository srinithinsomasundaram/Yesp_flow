"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileSignature,
  Trash2,
  Loader2,
  Type,
  X,
  FolderOpen,
} from "lucide-react";

export function parseSignature(sig: string): {
  isImage: boolean;
  imageUrl: string | null;
  signOffText: string;
  width: number;
  rawText: string;
} {
  if (!sig) {
    return { isImage: true, imageUrl: null, signOffText: "Best regards,", width: 260, rawText: "" };
  }
  const imgMatch = sig.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    const imageUrl = imgMatch[1];
    const widthMatch = imgMatch[0].match(/max-width:\s*(\d+)px/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 260;
    const withoutImg = sig.replace(/<img[^>]*>/gi, "");
    const cleanText = withoutImg
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    return {
      isImage: true,
      imageUrl,
      signOffText: cleanText,
      width,
      rawText: sig,
    };
  }
  return {
    isImage: false,
    imageUrl: null,
    signOffText: "Best regards,",
    width: 260,
    rawText: sig,
  };
}

export function buildSignature(options: {
  mode: "image" | "text";
  imageUrl: string | null;
  signOffText: string;
  width: number;
  rawText: string;
}): string {
  if (options.mode === "image") {
    if (!options.imageUrl) {
      return options.signOffText.trim() ? options.signOffText.trim() : "";
    }
    const parts: string[] = [];
    if (options.signOffText.trim()) {
      parts.push(`<p style="margin:0 0 10px 0;font-family:inherit;">${options.signOffText.trim().replace(/\n/g, "<br />")}</p>`);
    }
    const widthStyle = options.width > 0 ? `max-width:${options.width}px;` : "max-width:100%;";
    parts.push(`<img src="${options.imageUrl}" alt="Signature" style="${widthStyle}width:100%;height:auto;display:block;" />`);
    return parts.join("");
  }
  return options.rawText;
}

interface SignatureEditorProps {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  files?: Array<{ id: string; name: string; url: string; mimeType?: string }>;
  idPrefix?: string;
}

export function SignatureEditor({
  value,
  onChange,
  enabled,
  onToggleEnabled,
  files = [],
  idPrefix = "sig-editor",
}: SignatureEditorProps) {
  const parsed = parseSignature(value);
  const [mode, setMode] = useState<"image" | "text">(parsed.imageUrl || !value ? "image" : "text");
  const [imageUrl, setImageUrl] = useState<string | null>(parsed.imageUrl);
  const [signOffText, setSignOffText] = useState<string>(parsed.signOffText || "Best regards,");
  const [width, setWidth] = useState<number>(parsed.width || 260);
  const [rawText, setRawText] = useState<string>(parsed.rawText || "Best regards,\n{{name}}\nYour Company | example.com");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when value prop changes externally (e.g. template selection change)
  useEffect(() => {
    const p = parseSignature(value);
    if (p.imageUrl) {
      setMode("image");
      setImageUrl(p.imageUrl);
      setSignOffText(p.signOffText);
      setWidth(p.width);
    } else if (value && !p.imageUrl) {
      setRawText(value);
      if (!imageUrl) setMode("text");
    }
  }, [value]);

  const updateSignature = (newMode: "image" | "text", newImg: string | null, newSignOff: string, newWidth: number, newRaw: string) => {
    const sigStr = buildSignature({
      mode: newMode,
      imageUrl: newImg,
      signOffText: newSignOff,
      width: newWidth,
      rawText: newRaw,
    });
    onChange(sigStr);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP, SVG, GIF).");
      return;
    }
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Failed to upload image");
      }
      setImageUrl(json.url);
      setMode("image");
      updateSignature("image", json.url, signOffText, width, rawText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    updateSignature("image", null, signOffText, width, rawText);
  };

  const libraryImages = files.filter(
    (f) => f.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name ?? "")
  );

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 transition-all space-y-3">
      {/* Header with Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <FileSignature className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor={`${idPrefix}-toggle`} className="text-xs font-semibold text-slate-800 cursor-pointer">
                Email Signature
              </label>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Optional
              </span>
              {enabled && imageUrl && (
                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <ImageIcon className="w-2.5 h-2.5" /> Image attached
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automatically appended to the end of outgoing emails
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id={`${idPrefix}-toggle`}
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              onToggleEnabled(checked);
              if (checked) {
                updateSignature(mode, imageUrl, signOffText, width, rawText);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      {enabled && (
        <div className="pt-2 border-t border-slate-200 space-y-3">
          {/* Mode Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("image");
                  updateSignature("image", imageUrl, signOffText, width, rawText);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === "image"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Image Signature
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("text");
                  updateSignature("text", imageUrl, signOffText, width, rawText);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === "text"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Text / HTML
              </button>
            </div>

            {mode === "image" && (
              <span className="text-[11px] text-slate-500 font-medium">
                Upload image banner, graphic, or digital sign-off
              </span>
            )}
          </div>

          {/* IMAGE SIGNATURE MODE */}
          {mode === "image" && (
            <div className="space-y-3">
              {/* Sign-off text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Sign-off line <span className="text-slate-400 font-normal">(optional text above image)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {["Best regards,", "Warmly,", "None"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const val = preset === "None" ? "" : preset;
                          setSignOffText(val);
                          updateSignature("image", imageUrl, val, width, rawText);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={signOffText}
                  onChange={(e) => {
                    setSignOffText(e.target.value);
                    updateSignature("image", imageUrl, e.target.value, width, rawText);
                  }}
                  placeholder="e.g. Best regards, or Cheers,"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800"
                />
              </div>

              {/* Upload or Preview Image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className="hidden"
                id={`${idPrefix}-file-upload`}
              />

              {uploadError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between">
                  <span>{uploadError}</span>
                  <button type="button" onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {imageUrl ? (
                /* Uploaded Image Preview Card */
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Uploaded Signature Image
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Image render box */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-start justify-center overflow-hidden">
                    {signOffText && (
                      <p className="text-xs text-slate-700 font-medium mb-2">{signOffText}</p>
                    )}
                    <div
                      className="rounded bg-white p-1 border border-slate-200/80 shadow-xs max-w-full"
                      style={{ maxWidth: `${width}px` }}
                    >
                      <img
                        src={imageUrl}
                        alt="Email Signature"
                        className="w-full h-auto object-contain rounded block"
                      />
                    </div>
                  </div>

                  {/* Width selection pills */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Display Width:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "Small (180px)", w: 180 },
                        { label: "Medium (260px)", w: 260 },
                        { label: "Large (360px)", w: 360 },
                        { label: "Full (480px)", w: 480 },
                      ].map((item) => (
                        <button
                          key={item.w}
                          type="button"
                          onClick={() => {
                            setWidth(item.w);
                            updateSignature("image", imageUrl, signOffText, item.w, rawText);
                          }}
                          className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                            width === item.w
                              ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* No Image: Upload dropzone */
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {isUploading ? "Uploading signature image…" : "Upload signature image"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WebP, SVG or GIF (transparent PNG recommended)
                    </span>
                  </div>

                  {libraryImages.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowLibraryModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Or choose from file library ({libraryImages.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TEXT / HTML SIGNATURE MODE */}
          {mode === "text" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Text or HTML Signature</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = "Best regards,\n{{name}}\nYour Company | example.com";
                      setRawText(sample);
                      updateSignature("text", imageUrl, signOffText, width, sample);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Reset sample
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawText("");
                        updateSignature("text", imageUrl, signOffText, width, "");
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  updateSignature("text", imageUrl, signOffText, width, e.target.value);
                }}
                rows={3}
                placeholder={"Best regards,\n{{name}}\nYour Company | example.com"}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none bg-white font-sans leading-relaxed text-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                Tip: Merge tags like <span className="font-mono text-blue-600">{"{{name}}"}</span> and HTML tags are supported.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Library Image Picker Modal */}
      {showLibraryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLibraryModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                Select Signature Image from Library
              </span>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                {libraryImages.map((f) => (
                  <button
                    key={f.id ?? f.url}
                    type="button"
                    onClick={() => {
                      setImageUrl(f.url);
                      setMode("image");
                      updateSignature("image", f.url, signOffText, width, rawText);
                      setShowLibraryModal(false);
                    }}
                    className="group border border-slate-200 rounded-xl overflow-hidden hover:border-blue-500 p-2 text-left bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center"
                  >
                    <img src={f.url} alt={f.name} className="h-20 w-auto object-contain rounded mb-1.5" />
                    <span className="text-[11px] font-medium text-slate-600 truncate w-full text-center group-hover:text-blue-600">
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
