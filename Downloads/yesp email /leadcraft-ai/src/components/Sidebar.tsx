"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Send,
  Settings,
  Mail,
  LayoutDashboard,
  LogOut,
  FileText,
  Clock,
  BarChart2,
  Paperclip,
  X,
} from "lucide-react";
import { signOut } from "@/actions/auth";

type User = { email: string; id: string } | null;

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Today's Queue", href: "/queue", icon: Clock },
  { name: "Email Accounts", href: "/email-accounts", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Files", href: "/files", icon: Paperclip },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  user,
  mobileOpen,
  onClose,
}: {
  user: User;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-200 flex flex-col bg-white select-none
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:inset-auto lg:translate-x-0 lg:w-60 lg:z-20 lg:h-full lg:shrink-0
      `}
    >
      {/* Branding */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flow-logo.png" alt="Flow" className="h-7 w-auto object-contain" />
          <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase leading-none">
            by Yesp
          </span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 px-3 mb-2 font-semibold">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.email ?? "Guest"}
              </p>
              <p className="text-[10px] text-slate-400">Pro</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
