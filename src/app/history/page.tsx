"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  Circle,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { Habit, DailyRecord, HabitEntry } from "@/types/routine";
import {
  formatCompactDate,
  getPresetDateRange,
  getTodayDateString,
} from "@/lib/date-utils";
import { isHabitApplicableOnDate } from "@/lib/habit-logic";

export default function HistoryPage() {
  const [dateRangePreset, setDateRangePreset] = useState<"past7" | "past30" | "month" | "custom">("past30");
  const [startDate, setStartDate] = useState(getPresetDateRange("past30").start);
  const [endDate, setEndDate] = useState(getPresetDateRange("past30").end);
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleHabitIds, setVisibleHabitIds] = useState<Set<string>>(new Set());
  const [showColumnFilter, setShowColumnFilter] = useState(false);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, HabitEntry>>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch history data
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          start: startDate,
          end: endDate,
          sort: sortAsc ? "asc" : "desc",
        });
        if (searchTerm.trim()) {
          queryParams.set("search", searchTerm.trim());
        }

        const res = await fetch(`/api/history?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setHabits(data.habits || []);
          setRecords(data.records || []);
          setEntriesMap(data.entries || {});

          // Default all habits visible if not set
          if (visibleHabitIds.size === 0 && data.habits) {
            setVisibleHabitIds(new Set(data.habits.map((h: Habit) => h.id)));
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [startDate, endDate, sortAsc, searchTerm]);

  // Handle Preset changes
  const handlePresetChange = (preset: "past7" | "past30" | "month" | "custom") => {
    setDateRangePreset(preset);
    if (preset === "past7") {
      const today = getTodayDateString();
      const [year, month, day] = today.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 6);
      const past7 = d.toISOString().slice(0, 10);
      setStartDate(past7);
      setEndDate(today);
    } else if (preset === "past30") {
      const r = getPresetDateRange("past30");
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (preset === "month") {
      const r = getPresetDateRange("month");
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  const toggleColumnVisibility = (habitId: string) => {
    const next = new Set(visibleHabitIds);
    if (next.has(habitId)) {
      if (next.size > 1) next.delete(habitId);
    } else {
      next.add(habitId);
    }
    setVisibleHabitIds(next);
  };

  const displayedHabits = habits.filter((h) => visibleHabitIds.has(h.id));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <span className="text-xs font-medium text-forest uppercase tracking-wider">
              Records
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              History & Daily Logs
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className="gap-1.5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Columns ({displayedHabits.length}/{habits.length})</span>
            </Button>
            <Link href="/exports">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                <span>Export Filtered</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Range Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-page p-1 rounded-md border border-border-subtle">
              <button
                onClick={() => handlePresetChange("past7")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  dateRangePreset === "past7"
                    ? "bg-white text-forest shadow-xs font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => handlePresetChange("past30")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  dateRangePreset === "past30"
                    ? "bg-white text-forest shadow-xs font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Past 30 Days
              </button>
              <button
                onClick={() => handlePresetChange("month")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  dateRangePreset === "month"
                    ? "bg-white text-forest shadow-xs font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateRangePreset("custom")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  dateRangePreset === "custom"
                    ? "bg-white text-forest shadow-xs font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Custom Dates Inputs */}
            {dateRangePreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-border-subtle bg-white"
                />
                <span className="text-xs text-charcoal-muted">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-border-subtle bg-white"
                />
              </div>
            )}

            {/* Search Box */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Input
                type="text"
                placeholder="Search notes, entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-charcoal-muted" />
            </div>

            {/* Sort Order Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortAsc(!sortAsc)}
              className="gap-1 text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortAsc ? "Oldest First" : "Newest First"}</span>
            </Button>
          </div>

          {/* Column Visibility Selector Drawer */}
          {showColumnFilter && (
            <div className="pt-3 border-t border-border-subtle animate-in fade-in duration-150">
              <span className="text-xs font-semibold text-charcoal block mb-2">
                Visible Habit Columns
              </span>
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => {
                  const isVisible = visibleHabitIds.has(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleColumnVisibility(h.id)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        isVisible
                          ? "bg-sage border-forest/30 text-forest font-medium"
                          : "bg-white border-border-subtle text-charcoal-muted hover:border-charcoal-muted"
                      }`}
                    >
                      {h.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Dynamic Matrix Table */}
        <Card className="p-0 overflow-hidden shadow-subtle border-border-subtle">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-sage/50 border-b border-border-subtle text-charcoal font-semibold">
                  <th className="sticky left-0 z-20 bg-sage/90 backdrop-blur-xs px-4 py-3 min-w-[120px] shadow-xs">
                    Date
                  </th>
                  <th className="px-4 py-3 min-w-[180px]">Daily Notes</th>
                  {displayedHabits.map((habit) => (
                    <th
                      key={habit.id}
                      className="px-4 py-3 min-w-[140px] max-w-[200px] border-l border-border-subtle/50"
                    >
                      <div className="flex flex-col">
                        <span className="truncate">{habit.name}</span>
                        <span className="text-[10px] font-normal text-charcoal-muted">
                          {habit.category}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={displayedHabits.length + 3}
                      className="py-12 text-center text-charcoal-muted"
                    >
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent mx-auto mb-2" />
                      Loading history records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayedHabits.length + 3}
                      className="py-12 text-center text-charcoal-muted"
                    >
                      No records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const recordEntries = entriesMap[record.id] || {};

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-page/80 transition-colors group"
                      >
                        {/* Sticky Date Column */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-page/90 px-4 py-3 font-medium text-charcoal shadow-xs">
                          <Link
                            href={`/routine?date=${record.date}`}
                            className="hover:text-forest hover:underline"
                          >
                            {formatCompactDate(record.date)}
                          </Link>
                        </td>

                        {/* Daily Notes */}
                        <td className="px-4 py-3 text-charcoal-muted max-w-[220px] truncate">
                          {record.notes || <span className="text-gray-300">-</span>}
                        </td>

                        {/* Dynamic Habit Columns */}
                        {displayedHabits.map((habit) => {
                          const isApplicable = isHabitApplicableOnDate(habit, record.date);
                          if (!isApplicable) {
                            return (
                              <td
                                key={habit.id}
                                className="px-4 py-3 text-center text-charcoal-muted/50 border-l border-border-subtle/30 bg-page/30"
                              >
                                <span className="text-[11px] italic">N/A</span>
                              </td>
                            );
                          }

                          const entry = recordEntries[habit.id];
                          if (!entry) {
                            return (
                              <td
                                key={habit.id}
                                className="px-4 py-3 text-center text-gray-300 border-l border-border-subtle/30"
                              >
                                -
                              </td>
                            );
                          }

                          const isCompleted = entry.is_completed;
                          const val = entry.value;

                          return (
                            <td
                              key={habit.id}
                              className="px-4 py-3 border-l border-border-subtle/30"
                            >
                              <div className="flex items-center gap-1.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-charcoal-muted/40 shrink-0" />
                                )}
                                <span className="truncate text-xs text-charcoal">
                                  {habit.field_type === "checkbox"
                                    ? val?.duration
                                      ? `${val.duration}m`
                                      : isCompleted
                                      ? "Done"
                                      : "No"
                                    : habit.field_type === "time"
                                    ? typeof val === "object"
                                      ? val?.time || "-"
                                      : val || "-"
                                    : habit.field_type === "duration"
                                    ? typeof val === "object"
                                      ? `${val?.duration || 0}m`
                                      : `${val}m`
                                    : habit.field_type === "url"
                                    ? typeof val === "object"
                                      ? val?.title || "Link"
                                      : "Link"
                                    : typeof val === "object"
                                    ? val?.text || val?.selected || String(val?.number ?? "-")
                                    : String(val ?? "-")}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Row Action: Edit Routine for this day */}
                        <td className="px-4 py-3 text-right">
                          <Link href={`/routine?date=${record.date}`}>
                            <button
                              title="Edit routine for this date"
                              className="p-1.5 text-charcoal-muted hover:text-forest hover:bg-sage-light rounded transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
