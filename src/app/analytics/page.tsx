"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Flame,
  Award,
  Clock,
  Dumbbell,
  BookOpen,
  Footprints,
  Video,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { formatDisplayDate, getTodayDateString } from "@/lib/date-utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const todayStr = getTodayDateString();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-border-subtle">
          <span className="text-xs font-medium text-forest uppercase tracking-wider">
            Insights & Metrics
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Progress Analytics
          </h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Real performance calculated from persisted PostgreSQL routine entries
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-charcoal-muted">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent mx-auto mb-2" />
            Aggregating routine statistics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Streaks & Overall Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-charcoal-muted">
                    Current Streak
                  </span>
                  <div className="p-1.5 rounded-md bg-amber-50 text-status-warning">
                    <Flame className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-3xl font-bold text-charcoal">
                    {data?.streaks?.currentOverallStreak ?? 0}
                  </span>
                  <span className="text-xs text-charcoal-muted">days</span>
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  Consecutive days of 100% completion
                </p>
              </Card>

              <Card>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-charcoal-muted">
                    Longest Streak
                  </span>
                  <div className="p-1.5 rounded-md bg-emerald-50 text-forest">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-3xl font-bold text-charcoal">
                    {data?.streaks?.longestOverallStreak ?? 0}
                  </span>
                  <span className="text-xs text-charcoal-muted">days</span>
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  All-time best streak
                </p>
              </Card>

              <Card>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-charcoal-muted">
                    Monthly Consistency
                  </span>
                  <div className="p-1.5 rounded-md bg-sage text-forest">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-3xl font-bold text-charcoal">
                    {data?.monthly?.completionRate ?? 0}%
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  {data?.monthly?.totalCompletedActivities ?? 0} habits logged in 30 days
                </p>
              </Card>

              <Card>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-charcoal-muted">
                    Today's Rate
                  </span>
                  <div className="p-1.5 rounded-md bg-blue-50 text-status-info">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-3xl font-bold text-charcoal">
                    {data?.today?.percentage ?? 0}%
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    ({data?.today?.completedHabitsCount ?? 0}/{data?.today?.applicableHabitsCount ?? 0})
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-muted">
                  {data?.today?.applicableHabitsCount === 0
                    ? "No habits scheduled"
                    : `${data.today.applicableHabitsCount - data.today.completedHabitsCount} habits remaining`}
                </p>
              </Card>
            </div>

            {/* Weekly Activity Specific Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-4 w-4 text-forest" />
                  <span className="text-xs font-medium text-charcoal-muted">Workout</span>
                </div>
                <span className="text-xl font-bold text-charcoal">
                  {data?.weekly?.totalWorkoutMinutes ?? 0}
                </span>
                <span className="text-xs text-charcoal-muted ml-1">mins this week</span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-forest" />
                  <span className="text-xs font-medium text-charcoal-muted">Learning</span>
                </div>
                <span className="text-xl font-bold text-charcoal">
                  {data?.weekly?.totalLearningMinutes ?? 0}
                </span>
                <span className="text-xs text-charcoal-muted ml-1">mins this week</span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Footprints className="h-4 w-4 text-forest" />
                  <span className="text-xs font-medium text-charcoal-muted">Walking</span>
                </div>
                <span className="text-xl font-bold text-charcoal">
                  {data?.weekly?.walkingCompletedCount ?? 0}
                </span>
                <span className="text-xs text-charcoal-muted ml-1">walks completed</span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-forest" />
                  <span className="text-xs font-medium text-charcoal-muted">YouTube</span>
                </div>
                <span className="text-xl font-bold text-charcoal">
                  {data?.weekly?.youTubeUploadsCount ?? 0}
                </span>
                <span className="text-xs text-charcoal-muted ml-1">uploads</span>
              </Card>
            </div>

            {/* Weekly Completion Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">7-Day Consistency Breakdown</CardTitle>
                <p className="text-xs text-charcoal-muted">
                  Daily completion percentages across the past 7 days
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-7 gap-3">
                  {data?.weekly?.days?.map((day: any) => {
                    const isToday = day.date === todayStr;
                    const dateObj = new Date(day.date + "T00:00:00");
                    const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                    return (
                      <div
                        key={day.date}
                        className={`flex flex-col items-center p-3 rounded-lg border text-center ${
                          isToday
                            ? "bg-sage/50 border-forest"
                            : "bg-surface border-border-subtle"
                        }`}
                      >
                        <span className="text-xs text-charcoal-muted">{dayLabel}</span>
                        <span className="text-xs font-bold text-charcoal mb-2">
                          {dateObj.getDate()}
                        </span>
                        <div className="w-full bg-sage-light h-24 rounded flex flex-col justify-end overflow-hidden p-0.5">
                          <div
                            className="bg-forest w-full rounded-xs transition-all duration-300"
                            style={{ height: `${day.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-charcoal mt-2">
                          {day.percentage}%
                        </span>
                        <span className="text-[10px] text-charcoal-muted">
                          {day.completedHabitsCount}/{day.applicableHabitsCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Per-Habit Streaks & Consistency Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Per-Habit Consistency & Streaks</CardTitle>
                <p className="text-xs text-charcoal-muted">
                  Streaks calculated based on individual habit active dates and applicable weekly schedules
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="divide-y divide-border-subtle">
                  {data?.streaks?.habitStreaks?.map((item: any) => (
                    <div
                      key={item.habitId}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-charcoal block truncate">
                          {item.habitName}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-charcoal-muted mt-0.5">
                          <span>Rate: {item.completionRate}%</span>
                          <span>•</span>
                          <span>{item.totalCompletions} total completions</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 text-status-warning text-xs font-semibold">
                          <Flame className="h-3.5 w-3.5" />
                          <span>{item.currentStreak} day streak</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-charcoal-muted min-w-[90px]">
                          <Award className="h-3.5 w-3.5 text-forest" />
                          <span>Best: {item.longestStreak}d</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
