"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Settings,
  Globe,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [weekStartsOn, setWeekStartsOn] = useState(1); // 1 = Mon

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setTimezone(profile.timezone || "Asia/Kolkata");
      setDateFormat(profile.date_format || "YYYY-MM-DD");
      setTimeFormat(profile.time_format || "12h");
      setWeekStartsOn(profile.week_starts_on ?? 1);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          date_format: dateFormat,
          time_format: timeFormat,
          week_starts_on: weekStartsOn,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update settings");
      }

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="pb-2 border-b border-border-subtle">
          <span className="text-xs font-medium text-forest uppercase tracking-wider">
            Preferences
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Application Settings
          </h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Configure timezones, formatting preferences, and account security
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-md bg-status-error-bg text-status-error text-xs border border-red-200">
            {errorMsg}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 rounded-md bg-status-success-bg text-status-success text-xs border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Timezone & Localization */}
          <Card>
            <CardHeader className="pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-forest" />
                <CardTitle className="text-sm">Timezone & Localization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Primary Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30) [Recommended]</option>
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                </select>
                <span className="text-[11px] text-charcoal-muted mt-1 block">
                  Ensures routine dates and daily midnight cutoffs are strictly aligned without day-shifting UTC bugs.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Time Format
                  </label>
                  <select
                    value={timeFormat}
                    onChange={(e: any) => setTimeFormat(e.target.value)}
                    className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle"
                  >
                    <option value="12h">12-Hour (e.g. 07:00 AM, 11:00 PM)</option>
                    <option value="24h">24-Hour (e.g. 07:00, 23:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    First Day of Week
                  </label>
                  <select
                    value={weekStartsOn}
                    onChange={(e) => setWeekStartsOn(Number(e.target.value))}
                    className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle"
                  >
                    <option value={1}>Monday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account & Security Information */}
          <Card>
            <CardHeader className="pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest" />
                <CardTitle className="text-sm">Account & Privacy</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between py-1 border-b border-border-subtle">
                <span className="text-xs text-charcoal-muted">Authenticated Email</span>
                <span className="text-xs font-semibold text-charcoal">
                  {user?.email || "Personal User"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border-subtle">
                <span className="text-xs text-charcoal-muted">Row Level Security</span>
                <Badge variant="success">Active (auth.uid = user_id)</Badge>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border-subtle">
                <span className="text-xs text-charcoal-muted">PostgreSQL Store</span>
                <Badge variant="sage">Supabase Cloud Database</Badge>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-charcoal-muted">Session Management</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="gap-1.5 text-xs text-status-error hover:bg-status-error-bg"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out of Session</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} className="gap-2 shadow-subtle">
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
