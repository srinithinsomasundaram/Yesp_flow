import { FileText } from "lucide-react";
import { getTemplates } from "@/actions/templates";
import { getFiles } from "@/actions/files";
import { TemplateForm } from "@/components/TemplateForm";
import { TemplateCard } from "@/components/TemplateCard";
import { TemplateFilterClient } from "@/components/TemplateFilterClient";

export const dynamic = "force-dynamic";

const ALL_CATEGORIES = [
  "All",
  "Introduction",
  "Cold Outreach",
  "Follow-up",
  "Product Pitch",
  "Meeting Request",
  "Proposal",
  "Final Follow-up",
  "Custom",
];

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const [templates, files] = await Promise.all([getTemplates(), getFiles()]);
  const { category = "All", q = "" } = await searchParams;

  const filtered = templates.filter((t) => {
    const matchesCategory = category === "All" || t.category === category;
    const matchesSearch =
      !q ||
      t.name?.toLowerCase().includes(q.toLowerCase()) ||
      t.subject?.toLowerCase().includes(q.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Templates</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Email Templates</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Write HTML email bodies with live preview. Use merge tags like{" "}
          <code className="bg-slate-100 px-1 rounded text-xs font-mono">{"{{name}}"}</code>,{" "}
          <code className="bg-slate-100 px-1 rounded text-xs font-mono">{"{{company}}"}</code>.
          &nbsp;{templates.length} saved.
        </p>
      </div>

      {/* Search + Category Filter */}
      <TemplateFilterClient
        categories={ALL_CATEGORIES}
        currentCategory={category}
        currentSearch={q}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <TemplateForm files={files} />
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} files={files} />
        ))}
        {filtered.length === 0 && templates.length > 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">
            No templates match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
