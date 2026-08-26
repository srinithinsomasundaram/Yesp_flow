"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, Users, Megaphone, X, Menu } from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { searchGlobal, type SearchResult } from "@/actions/search";
import { useRouter } from "next/navigation";

export function AppHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("header-unread-counter")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "EmailActivity" },
        () => {
          if (!notifOpen) setUnread((n) => n + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [notifOpen]);

  const handleOpen = () => {
    setNotifOpen(true);
    setUnread(0);
  };

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchGlobal(q);
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const contacts = results.filter((r) => r.type === "contact");
  const campaigns = results.filter((r) => r.type === "campaign");

  return (
    <>
      <header className="h-16 border-b border-slate-200 px-4 md:px-6 flex items-center gap-3 justify-between bg-white/90 backdrop-blur-xl shrink-0 z-10">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-xs" ref={containerRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="Search contacts, campaigns..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm pl-9 pr-8 py-2 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {open && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
              {loading && (
                <div className="px-4 py-3 text-xs text-slate-400">Searching...</div>
              )}

              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-xs text-slate-400">No results for &ldquo;{query}&rdquo;</div>
              )}

              {!loading && contacts.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contacts</span>
                  </div>
                  {contacts.map((r, i) => {
                    const globalIndex = i;
                    return (
                      <button
                        key={r.id}
                        onMouseDown={() => handleSelect(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          activeIndex === globalIndex ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                          {r.label.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                          {r.sublabel && <div className="text-xs text-slate-400 truncate font-mono">{r.sublabel}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && campaigns.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                    <Megaphone className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campaigns</span>
                  </div>
                  {campaigns.map((r, i) => {
                    const globalIndex = contacts.length + i;
                    return (
                      <button
                        key={r.id}
                        onMouseDown={() => handleSelect(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          activeIndex === globalIndex ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                          <Megaphone className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                          {r.sublabel && <div className="text-xs text-slate-400 truncate capitalize">{r.sublabel}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 mt-1">
                  <span className="text-[10px] text-slate-400">↑↓ navigate · Enter select · Esc close</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpen}
            className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </header>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
