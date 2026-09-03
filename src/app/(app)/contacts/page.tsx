import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { getContactsPage, getContactTabCounts } from "@/actions/contacts";
import { CONTACTS_PAGE_SIZE } from "@/lib/pagination";
import { getCampaigns } from "@/actions/campaigns";
import { CsvUploader } from "@/components/CsvUploader";
import { ManualContactForm } from "@/components/ManualContactForm";
import { ContactsTable } from "@/components/ContactsTable";
import type { ContactTabCounts } from "@/types/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter = "all", page: pageStr = "0" } = await searchParams;
  const page = Math.max(0, parseInt(pageStr, 10) || 0);

  const [counts, contacts, campaigns] = await Promise.all([
    getContactTabCounts(),
    getContactsPage(filter, page),
    getCampaigns(),
  ]);

  const tabs: Array<{ id: string; label: string; count: number }> = [
    { id: "all",       label: "All",          count: counts.all },
    { id: "new",       label: "Unsent",       count: counts.unsent },
    { id: "today",     label: "Pending Today", count: counts.today },
    { id: "replied",   label: "Replied",      count: counts.replied },
    { id: "completed", label: "Completed",    count: counts.completed },
    { id: "bounced",   label: "Bounced",      count: counts.bounced },
  ];

  const activeCount = tabs.find((t) => t.id === filter)?.count ?? counts.all;
  const totalPages  = Math.ceil(activeCount / CONTACTS_PAGE_SIZE);
  const hasPrev     = page > 0;
  const hasNext     = page < totalPages - 1;
  const rangeStart  = activeCount === 0 ? 0 : page * CONTACTS_PAGE_SIZE + 1;
  const rangeEnd    = Math.min(page * CONTACTS_PAGE_SIZE + contacts.length, activeCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Contacts
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Lead & Contact Database</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {counts.all} total contacts · manage prospects, campaigns, and statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <ManualContactForm campaigns={campaigns} />
          <CsvUploader campaigns={campaigns} />
        </div>
      </div>

      {/* Underline filter tabs */}
      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/contacts?filter=${tab.id}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              filter === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                filter === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <ContactsTable contacts={contacts} campaigns={campaigns} />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {activeCount} contacts
          </span>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link
                href={`/contacts?filter=${filter}&page=${page - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </span>
            )}
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={`/contacts?filter=${filter}&page=${page + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
