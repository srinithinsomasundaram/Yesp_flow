import { Users } from "lucide-react";
import { getContacts } from "@/actions/contacts";
import { getCampaigns } from "@/actions/campaigns";
import { CsvUploader } from "@/components/CsvUploader";
import { ManualContactForm } from "@/components/ManualContactForm";
import { ContactsTable } from "@/components/ContactsTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [allContacts, campaigns] = await Promise.all([getContacts(), getCampaigns()]);
  const { filter = "all" } = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contacts = allContacts.filter((c) => {
    if (filter === "all") return true;
    const s = c.states?.[0];
    if (!s) return false;
    const nextDate = s.nextActionDate ? new Date(s.nextActionDate) : null;
    if (filter === "new") return s.status === "New";
    if (filter === "today")
      return (s.status === "Contacted" || s.status === "Waiting") && nextDate && nextDate <= today;
    if (filter === "replied") return s.status === "Replied";
    if (filter === "completed") return s.status === "Completed";
    if (filter === "bounced") return s.status === "Bounced";
    return true;
  });

  const tabs = [
    { id: "all", label: "All", count: allContacts.length },
    {
      id: "new",
      label: "Unsent",
      count: allContacts.filter((c) => c.states?.[0]?.status === "New").length,
    },
    {
      id: "today",
      label: "Pending Today",
      count: allContacts.filter((c) => {
        const s = c.states?.[0];
        return (
          (s?.status === "Waiting" && s?.nextActionDate && new Date(s.nextActionDate) <= today) ||
          s?.status === "New"
        );
      }).length,
    },
    {
      id: "replied",
      label: "Replied",
      count: allContacts.filter((c) => c.states?.[0]?.status === "Replied").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: allContacts.filter((c) => c.states?.[0]?.status === "Completed").length,
    },
    {
      id: "bounced",
      label: "Bounced",
      count: allContacts.filter((c) => c.states?.[0]?.status === "Bounced").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header — same pattern as dashboard */}
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
            {allContacts.length} total contacts · manage prospects, campaigns, and statuses.
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
    </div>
  );
}
