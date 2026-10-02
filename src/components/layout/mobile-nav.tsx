"use client";

import React, { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_MOBILE_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/routine", icon: CalendarCheck },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
];

const ALL_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today's Routine", href: "/routine", icon: CalendarCheck },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Manage Habits", href: "/habits", icon: Sliders },
  { name: "Data & Exports", href: "/exports", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border-subtle sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-charcoal">
            Daily Routine
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="Toggle Navigation Menu"
          className="p-1.5 rounded-md text-charcoal-muted hover:bg-sage-light hover:text-charcoal"
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-surface pt-16 px-4 pb-6 animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-charcoal">
                Menu & Sections
              </span>
              <span className="text-xs text-charcoal-muted truncate max-w-[200px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-md hover:bg-sage-light"
            >
              <X className="h-5 w-5 text-charcoal" />
            </button>
          </div>

          <nav className="flex-1 py-4 space-y-1">
            {ALL_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sage text-forest font-semibold"
                      : "text-charcoal hover:bg-page"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-forest" : "text-charcoal-muted"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              setDrawerOpen(false);
              signOut();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border-subtle text-status-error text-sm font-medium hover:bg-status-error-bg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Rail */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around py-1.5 px-2 safe-area-bottom">
        {PRIMARY_MOBILE_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-md transition-colors min-w-[60px]",
                isActive
                  ? "text-forest font-semibold"
                  : "text-charcoal-muted hover:text-charcoal"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-md text-charcoal-muted hover:text-charcoal min-w-[60px]"
        >
          <Sliders className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] leading-tight">More</span>
        </button>
      </nav>
    </>
  );
}
