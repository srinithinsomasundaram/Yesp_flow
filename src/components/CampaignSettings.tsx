"use client";

import { useState } from "react";
import { Settings, Save, Loader2, ArrowLeft, Mail, AlertTriangle, Play, Pause, Clock } from "lucide-react";
import { updateCampaign } from "@/actions/campaigns";
import { TriggerFollowUpsButton } from "@/components/TriggerFollowUpsButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CampaignSettings({
  campaign,
  emailAccounts,
}: {
  campaign: any;
  emailAccounts: any[];
}) {
  const router = useRouter();
  const isLive = campaign.status === "active" && campaign.cronEnabled;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [dailyLimit, setDailyLimit] = useState(campaign.dailyLimit || 200);
  const [pacingSeconds, setPacingSeconds] = useState(campaign.pacingSeconds || 30);
  const [cronTime, setCronTime] = useState(campaign.cronTime || "09:00");
  const [cronEnabled, setCronEnabled] = useState(campaign.cronEnabled || false);
  const [timezone, setTimezone] = useState(campaign.timezone || "Asia/Kolkata");
  const [startTime, setStartTime] = useState(campaign.startTime || "09:00");
  const [endTime, setEndTime] = useState(campaign.endTime || "17:00");
  const [emailAccountId, setEmailAccountId] = useState<string>(campaign.emailAccountId || "");

  const parsedDays: string[] = campaign.sendingDays
    ? campaign.sendingDays.split(",").map((d: string) => d.trim())
    : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const [sendingDays, setSendingDays] = useState<string[]>(parsedDays);

  const toggleDay = (day: string) => {
    setSendingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleToggleAutomation = async () => {
    setIsPublishing(true);
    await updateCampaign(campaign.id, {
      status: isLive ? "paused" : "active",
      cronEnabled: !isLive,
      ...(!isLive && !campaign.cronTime ? { cronTime: campaign.startTime || "09:00" } : {}),
    });
    setIsPublishing(false);
    router.refresh();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateCampaign(campaign.id, {
      dailyLimit: parseInt(dailyLimit.toString()) || 200,
      pacingSeconds: parseInt(pacingSeconds.toString()) || 30,
      cronTime,
      cronEnabled,
      timezone,
      sendingDays: sendingDays.join(","),
      startTime,
      endTime,
      emailAccountId: emailAccountId || undefined,
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  const inputClass =
    "px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const linkedAccount = emailAccounts.find((a) => a.id === (emailAccountId || campaign.emailAccountId));
  const hasNoAccount = !linkedAccount;

  return (
    <header className="space-y-4">
      <div>
        <Link
          href="/campaigns"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{campaign.name}</h1>
      </div>

      {/* No email account warning */}
      {hasNoAccount && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            No email account linked. Emails won&apos;t send until you assign one below.
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Fix now
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Campaign Settings</p>

          {/* Email Account */}
          <div>
            <label className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Sending Account <span className="text-red-500">*</span>
            </label>
            <select
              value={emailAccountId}
              onChange={(e) => setEmailAccountId(e.target.value)}
              className={`w-full max-w-xs ${inputClass}`}
            >
              <option value="">— Select an email account —</option>
              {emailAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.senderEmail})
                </option>
              ))}
            </select>
            {emailAccounts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No accounts yet.{" "}
                <Link href="/email-accounts" className="underline hover:text-amber-800">
                  Add one in Email Accounts
                </Link>
                .
              </p>
            )}
          </div>

          {/* Row 1: Basic */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">Daily Limit</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={`w-full ${inputClass}`}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">Pacing (sec)</label>
              <input
                type="number"
                value={pacingSeconds}
                onChange={(e) => setPacingSeconds(e.target.value)}
                className={`w-full ${inputClass}`}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">Send Window</label>
              <div className="flex items-center gap-1">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
                <span className="text-slate-400 text-xs">–</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`w-full ${inputClass}`}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Days + auto-send */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-2">Sending Days</label>
              <div className="flex items-center gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      sendingDays.includes(day)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cronEnabled}
                  onChange={(e) => setCronEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
                Auto Send
              </label>
              {cronEnabled && (
                <input
                  type="time"
                  value={cronTime}
                  onChange={(e) => setCronTime(e.target.value)}
                  className={inputClass}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Automation status bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Automation Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Automation Paused
              </span>
            )}

            <button
              onClick={handleToggleAutomation}
              disabled={isPublishing || hasNoAccount}
              title={hasNoAccount ? "Link an email account before publishing" : undefined}
              className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border transition-all disabled:opacity-50 ${
                isLive
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPublishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isLive ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isPublishing ? "Updating..." : isLive ? "Pause Automation" : "Publish Automation"}
            </button>

            <div className="ml-auto flex items-center gap-3">
              <TriggerFollowUpsButton campaignId={campaign.id} label="Run Now" />
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
            </div>
          </div>

          {/* Campaign info row */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-5 flex-wrap">
            {linkedAccount ? (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold text-slate-900">{linkedAccount.label}</span>
                <span className="text-slate-400 font-mono text-xs">({linkedAccount.senderEmail})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> No account
              </span>
            )}
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{campaign.dailyLimit}</span> emails/day
            </span>
            {campaign.startTime && campaign.endTime && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">
                  {campaign.startTime} – {campaign.endTime}
                </span>
                {campaign.timezone && (
                  <span className="text-slate-400 text-xs font-mono">({campaign.timezone})</span>
                )}
              </span>
            )}
            {campaign.sendingDays && (
              <span className="text-sm text-slate-600">
                Days: <span className="font-semibold text-slate-900">{campaign.sendingDays}</span>
              </span>
            )}
            {campaign.cronEnabled && campaign.cronTime && (
              <span className="text-sm text-slate-600">
                Scheduled: <span className="font-semibold text-slate-900">{campaign.cronTime}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
