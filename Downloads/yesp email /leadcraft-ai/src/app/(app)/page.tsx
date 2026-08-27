import { Mail, Clock, CheckCircle2, AlertCircle, Zap, ChevronRight, Activity } from "lucide-react";
import { getContacts } from "@/actions/contacts";
import { getEmailActivity } from "@/actions/activity";
import { TriggerFollowUpsButton } from "@/components/TriggerFollowUpsButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [contacts, recentLogs] = await Promise.all([
    getContacts(),
    getEmailActivity(10),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const metrics = {
    newEmails: contacts.filter(c => c.states?.[0]?.status === "New").length,
    followUps: contacts.filter(c => {
      const s = c.states?.[0];
      return s?.status === "Waiting" && s.nextActionDate && new Date(s.nextActionDate) <= today;
    }).length,
    replies: contacts.filter(c => c.states?.[0]?.status === "Replied").length,
    bounced: contacts.filter(c => c.states?.[0]?.status === "Bounced").length,
    total: contacts.length,
  };

  const todaysActions = contacts.filter(c => {
    const s = c.states?.[0];
    if (!s) return false;
    if (s.status === "New") return true;
    if (s.status === "Waiting" && s.nextActionDate && new Date(s.nextActionDate) <= today) return true;
    return false;
  }).slice(0, 30);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main Content ─────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your outreach pipeline at a glance.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="New Emails"
            value={metrics.newEmails}
            color="blue"
            icon={<Mail className="w-4 h-4" />}
            sub="Ready to send"
          />
          <MetricCard
            label="Follow-ups Due"
            value={metrics.followUps}
            color="amber"
            icon={<Clock className="w-4 h-4" />}
            sub="Action needed"
          />
          <MetricCard
            label="Replies"
            value={metrics.replies}
            color="emerald"
            icon={<CheckCircle2 className="w-4 h-4" />}
            sub="Received"
          />
          <MetricCard
            label="Bounced"
            value={metrics.bounced}
            color="red"
            icon={<AlertCircle className="w-4 h-4" />}
            sub="Deliveries failed"
          />
        </div>

        {/* Today's schedule table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" /> Today's Schedule
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {todaysActions.length} contact{todaysActions.length !== 1 ? "s" : ""} queued
              </p>
            </div>
            <Link
              href="/contacts"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaysActions.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">All caught up for today</p>
              <p className="text-xs text-slate-400 mt-1">No pending emails or follow-ups.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todaysActions.map((contact) => {
                const state = contact.states?.[0];
                const isNew = state?.status === "New";
                const initials = (contact.name || contact.email).substring(0, 2).toUpperCase();

                return (
                  <div key={contact.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isNew ? "bg-blue-600 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{contact.name || contact.email}</p>
                        <p className="text-xs text-slate-400 font-mono">{contact.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 hidden sm:block">{state?.campaign?.name || "No campaign"}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        isNew
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {isNew ? "Send today" : `Follow-up #${state?.currentStep}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar ─────────────────────────── */}
      <aside className="w-full lg:w-72 lg:shrink-0 space-y-4">
        {/* Run pipeline */}
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <h3 className="text-sm font-semibold mb-0.5">Run Email Pipeline</h3>
          <p className="text-xs text-blue-200 mb-3">
            {metrics.newEmails + metrics.followUps} actions queued and ready.
          </p>
          <TriggerFollowUpsButton label="Send Now" variant="white" />
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overview</h3>
          <div className="space-y-2">
            <StatRow label="Total contacts" value={metrics.total} />
            <StatRow label="Active sequences" value={metrics.newEmails + metrics.followUps} />
            <StatRow label="Reply rate" value={metrics.total > 0 ? `${Math.round((metrics.replies / metrics.total) * 100)}%` : "—"} />
            <StatRow label="Bounce rate" value={metrics.total > 0 ? `${Math.round((metrics.bounced / metrics.total) * 100)}%` : "—"} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Logs</h3>
            <Link href="/activity" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-5 h-5 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No logs yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {(log.contact as any)?.name || (log.contact as any)?.email || "Unknown"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{log.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Links</h3>
          {[
            { label: "Import Contacts", href: "/contacts" },
            { label: "Create Campaign", href: "/campaigns" },
            { label: "Email Templates", href: "/templates" },
            { label: "SMTP Settings", href: "/settings" },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 hover:text-blue-600 transition-colors group"
            >
              {link.label}
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}

function MetricCard({
  label, value, color, icon, sub
}: {
  label: string; value: number; color: "blue" | "amber" | "emerald" | "red"; icon: React.ReactNode; sub: string;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  }[color];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={`p-2 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="font-semibold text-slate-900 text-xs">{value}</span>
    </div>
  );
}
