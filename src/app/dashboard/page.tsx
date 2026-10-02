"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Flame,
  TrendingUp,
  Download,
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { formatDisplayDate, getTodayDateString } from "@/lib/date-utils";
import { Habit, HabitEntry, DayCompletionStats } from "@/types/routine";

export default function DashboardPage() {
  const [data, setData] = useState<{
    today: DayCompletionStats;
    weekly: { days: DayCompletionStats[] };
    monthly: { completionRate: number; totalCompletedActivities: number };
    streaks: {
      currentOverallStreak: number;
      longestOverallStreak: number;
      habitStreaks: Array<{ habitId: string; habitName: string; currentStreak: number }>;
    };
    wakeUpComparison?: { target: string | null; actual: string | null } | null;
    sleepTimeComparison?: { target: string | null; actual: string | null } | null;
  } | null>(null);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayEntries, setTodayEntries] = useState<Record<string, HabitEntry>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [analyticsRes, routineRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch(`/api/routine?date=${getTodayDateString()}`),
        ]);

        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          setData(analyticsJson);
        }

        if (routineRes.ok) {
          const routineJson = await routineRes.json();
          setHabits(routineJson.habits || []);
          setTodayEntries(routineJson.entries || {});
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const todayStr = getTodayDateString();
  const displayDate = formatDisplayDate(todayStr);

  const completionPct = data?.today?.percentage ?? 0;
  const completedCount = data?.today?.completedHabitsCount ?? 0;
  const applicableCount = data?.today?.applicableHabitsCount ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <span className="text-xs font-medium text-forest uppercase tracking-wider">
              Overview
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              {displayDate}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/routine">
              <Button size="sm" className="gap-1.5 shadow-subtle">
                <CalendarCheck className="h-4 w-4" />
                <span>Log Routine</span>
              </Button>
            </Link>
            <Link href="/habits">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span>Add Habit</span>
              </Button>
            </Link>
            <Link href="/exports">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlight Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Completion */}
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal-muted">
                Today's Progress
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sage text-forest">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-charcoal">
                  {completionPct}%
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({completedCount}/{applicableCount} habits)
                </span>
              </div>
              <div className="w-full bg-sage-light rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-forest h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, completionPct)}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-charcoal-muted">
              {applicableCount === 0
                ? "No habits scheduled today"
                : completedCount === applicableCount
                ? "All daily routines completed!"
                : `${applicableCount - completedCount} habits pending`}
            </span>
          </Card>

          {/* Current Streak */}
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal-muted">
                Current Streak
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-status-warning">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-charcoal">
                  {data?.streaks?.currentOverallStreak ?? 0}
                </span>
                <span className="text-xs text-charcoal-muted">days</span>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                Consecutive 100% completion
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-charcoal-muted">
              <Award className="h-3.5 w-3.5 text-forest" />
              <span>Best: {data?.streaks?.longestOverallStreak ?? 0} days</span>
            </div>
          </Card>

          {/* Monthly Completion Rate */}
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal-muted">
                30-Day Consistency
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-forest">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-charcoal">
                  {data?.monthly?.completionRate ?? 0}%
                </span>
                <span className="text-xs text-charcoal-muted">overall rate</span>
              </div>
              <p className="text-xs text-charcoal-muted mt-1">
                {data?.monthly?.totalCompletedActivities ?? 0} routines logged
              </p>
            </div>
            <span className="text-[11px] text-charcoal-muted">
              Calculated from active schedules
            </span>
          </Card>

          {/* Wake & Sleep Targets */}
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal-muted">
                Sleep & Wake Today
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-status-info">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                <span className="text-charcoal-muted">Wake-up:</span>
                <span className="font-medium text-charcoal">
                  {data?.wakeUpComparison?.actual || "Pending"}
                  <span className="text-[10px] text-charcoal-muted ml-1">
                    (Target: {data?.wakeUpComparison?.target || "07:00"})
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-charcoal-muted">Sleep:</span>
                <span className="font-medium text-charcoal">
                  {data?.sleepTimeComparison?.actual || "Pending"}
                  <span className="text-[10px] text-charcoal-muted ml-1">
                    (Target: {data?.sleepTimeComparison?.target || "23:00"})
                  </span>
                </span>
              </div>
            </div>
            <span className="text-[10px] text-charcoal-muted">
              Syncs with daily routine entry
            </span>
          </Card>
        </div>

        {/* 7-Day Completion Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Past 7 Days Consistency</CardTitle>
              <p className="text-xs text-charcoal-muted">
                Daily completion rates for the last week
              </p>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-forest hover:text-forest-dark font-medium flex items-center gap-1"
            >
              <span>Detailed Analytics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 pt-3">
              {data?.weekly?.days?.map((day) => {
                const dayPct = day.percentage;
                const isToday = day.date === todayStr;
                const dateObj = new Date(day.date + "T00:00:00");
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = dateObj.getDate();

                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                      isToday
                        ? "border-forest bg-sage/40 shadow-xs"
                        : "border-border-subtle bg-white hover:bg-page"
                    }`}
                  >
                    <span className="text-[11px] font-medium text-charcoal-muted">
                      {dayName}
                    </span>
                    <span className="text-xs font-semibold text-charcoal mb-2">
                      {dayNum}
                    </span>
                    <div className="w-full bg-sage-light h-16 rounded-md flex flex-col justify-end overflow-hidden p-0.5">
                      <div
                        className="bg-forest w-full rounded-sm transition-all duration-300"
                        style={{ height: `${dayPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-charcoal mt-1.5">
                      {dayPct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Habits List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <CardTitle>Today's Habits & Routines</CardTitle>
              <p className="text-xs text-charcoal-muted">
                Track completion status and quickly navigate to log entries
              </p>
            </div>
            <Link href="/routine">
              <Button size="sm" variant="secondary" className="gap-1 text-xs">
                <span>Update Routine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-charcoal-muted">
                Loading today's habits...
              </div>
            ) : habits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-charcoal">No habits configured</p>
                <p className="text-xs text-charcoal-muted mt-1">
                  Create your first tracking field to get started!
                </p>
                <Link href="/habits" className="mt-3 inline-block">
                  <Button size="sm">Create Habit</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habits.map((habit) => {
                  const entry = todayEntries[habit.id];
                  const isCompleted = Boolean(entry?.is_completed);

                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCompleted
                          ? "bg-status-success-bg/40 border-green-200"
                          : "bg-surface border-border-subtle hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-status-success shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-charcoal-muted/50 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCompleted ? "text-charcoal" : "text-charcoal"
                            }`}
                          >
                            {habit.name}
                          </p>
                          <p className="text-[11px] text-charcoal-muted truncate">
                            {habit.category} • {habit.field_type}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isCompleted ? (
                          <Badge variant="success">Completed</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
