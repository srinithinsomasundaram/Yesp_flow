import { Paperclip } from "lucide-react";
import { getFiles } from "@/actions/files";
import { FileLibraryManager } from "@/components/FileLibraryManager";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const files = await getFiles();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Paperclip className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            File Library
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">File Library</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload PDFs, images, and documents. Files are stored in Supabase Storage.
        </p>
      </div>

      <FileLibraryManager files={files} />
    </div>
  );
}
