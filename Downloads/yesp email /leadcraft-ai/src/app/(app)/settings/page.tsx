import { Settings, User, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSettings } from "@/actions/settings";
import { getUser } from "@/actions/auth";
import { getEmailActivity } from "@/actions/activity";
import { getMyTeam } from "@/actions/teams";
import { SettingsForm } from "@/components/SettingsForm";
import { TeamManager } from "@/components/TeamManager";
import { SignOutButton } from "@/components/SignOutButton";
import { WebhookSetupGuide } from "@/components/WebhookSetupGuide";

export const dynamic = "force-dynamic";

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatJoined(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function SettingsPage() {
  const [initialSettings, user, logs, team] = await Promise.all([
    getSettings(),
    getUser(),
    getEmailActivity(25),
    getMyTeam(),
  ]);

  const email    = user?.email ?? "—";
  const initials = email.substring(0, 2).toUpperCase();
  const joined   = user?.created_at ? formatJoined(user.created_at) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Settings</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your account, API credentials, automation schedule, webhook tracking, and team access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* User Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Account</p>
                <p className="text-xs text-slate-500 mt-0.5">Your authenticated user details.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{email}</p>
                  {joined && <p className="text-xs text-slate-400 mt-0.5">Joined {joined}</p>}
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[240px]">
                    ID: {user?.id ?? "—"}
                  </p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>

          {/* API Key + Reporting Email + Automation */}
          <SettingsForm initialSettings={initialSettings} />

          {/* Webhook Tracking Setup Guide */}
          <WebhookSetupGuide />

          {/* Team & RBAC */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <TeamManager initialTeam={team} />
          </div>
        </div>

        {/* Right column: Recent Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">Recent Activity</span>
            </div>
            <Link href="/activity" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Activity className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No activity yet</p>
              <p className="text-xs text-slate-300 mt-0.5">Logs appear once emails start sending.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log: any) => {
                const initials2 = ((log.contact as any)?.name || (log.contact as any)?.email || "?").substring(0, 2).toUpperCase();
                return (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 mt-0.5">
                      {initials2}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {(log.contact as any)?.name || (log.contact as any)?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{log.type}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0 mt-0.5">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
