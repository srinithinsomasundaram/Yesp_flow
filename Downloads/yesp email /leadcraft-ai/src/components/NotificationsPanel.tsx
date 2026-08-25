"use client";

import { useEffect, useState, useRef } from "react";
import { X, Bell, Mail, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type ActivityItem = {
  id: string;
  type: string;
  timestamp: string;
  contact?: { name?: string | null; email?: string | null };
  isNew?: boolean;
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function getIcon(type: string) {
  if (type.toLowerCase().includes("replied"))
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  if (type.toLowerCase().includes("bounce"))
    return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Mail className="w-3.5 h-3.5 text-blue-600" />;
}

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Initial load
    supabase
      .from("EmailActivity")
      .select("*, contact:Contact(name, email)")
      .order("timestamp", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (data) setItems(data as ActivityItem[]);
        setLoading(false);
      });

    // Realtime new-row subscription
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "EmailActivity" },
        async (payload) => {
          const row = payload.new as ActivityItem;
          // Enrich with contact info
          const { data: contact } = await supabase
            .from("Contact")
            .select("name, email")
            .eq("id", (row as any).contactId)
            .single();
          setItems((prev) => [{ ...row, contact: contact ?? undefined, isNew: true }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900 text-sm">Notifications</span>
            {items.length > 0 && (
              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live indicator */}
        <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-slate-500 font-medium">Live — auto-updating</span>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Bell className="w-7 h-7 mb-2 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Activity appears here in real time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    item.isNew ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.contact?.name || item.contact?.email || "Contact"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.type}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-xs text-slate-400">{timeAgo(item.timestamp)}</span>
                      {item.isNew && (
                        <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
