"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  TrendingUp,
  Sliders,
  Database,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today's Routine", href: "/routine", icon: CalendarCheck },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Manage Habits", href: "/habits", icon: Sliders },
  { name: "Data & Exports", href: "/exports", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-surface h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-subtle">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-white shadow-subtle">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-charcoal">
            Daily Routine
          </h1>
          <p className="text-[11px] text-charcoal-muted">Private Tracker</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group",
                isActive
                  ? "bg-sage text-forest font-semibold shadow-xs"
                  : "text-charcoal-muted hover:bg-page hover:text-charcoal"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-forest"
                    : "text-charcoal-muted group-hover:text-charcoal"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Sign Out Footer */}
      <div className="p-3 border-t border-border-subtle bg-page/50">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-charcoal truncate">
              {user?.email || "Personal User"}
            </span>
            <span className="text-[10px] text-charcoal-muted">Private Account</span>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-charcoal-muted hover:text-status-error hover:bg-status-error-bg rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
