"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Copy,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import {
  getTodayDateString,
  formatDisplayDate,
  addDays,
  isDateInFuture,
  isDateToday,
} from "@/lib/date-utils";
import { Habit, HabitEntry, DailyRecord } from "@/types/routine";
import { isHabitApplicableOnDate, determineEntryCompletion } from "@/lib/habit-logic";

export default function RoutineEntryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [yesterdayEntries, setYesterdayEntries] = useState<Record<string, any>>({});
  const [dayNotes, setDayNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load routine data whenever selectedDate changes
  useEffect(() => {
    async function loadRoutine() {
      try {
        setIsLoading(true);
        setSaveStatus("idle");
        const res = await fetch(`/api/routine?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setHabits(data.habits || []);
          setRecord(data.record || null);
          setDayNotes(data.record?.notes || "");
          setYesterdayEntries(data.yesterdayEntries || {});

          // Map entries
          const loadedEntries: Record<string, any> = {};
          if (data.entries) {
            for (const hId in data.entries) {
              loadedEntries[hId] = data.entries[hId].value;
            }
          }
          setEntries(loadedEntries);
        } else {
          setErrorMessage("Failed to load routine for date.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load routine data");
      } finally {
        setIsLoading(false);
      }
    }

    loadRoutine();
  }, [selectedDate]);

  // Save routine handler
  const saveRoutineData = async (
    customEntries?: Record<string, any>,
    customNotes?: string
  ) => {
    try {
      setSaveStatus("saving");
      setErrorMessage("");

      const currentEntries = customEntries || entries;
      const currentNotes = customNotes !== undefined ? customNotes : dayNotes;

      // Transform entries into array for API
      const entriesArray = habits.map((h) => ({
        habit_id: h.id,
        value: currentEntries[h.id] ?? null,
      }));

      const res = await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          notes: currentNotes,
          entries: entriesArray,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Save failed");
      }

      const resData = await res.json();
      setRecord(resData.record);
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 3000);
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err.message || "Could not save routine");
    }
  };

  // Immediate save for checkboxes/toggles
  const handleEntryChange = (habitId: string, newValue: any, debounce = false) => {
    const updated = {
      ...entries,
      [habitId]: newValue,
    };
    setEntries(updated);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (debounce) {
      setSaveStatus("idle");
      saveTimeoutRef.current = setTimeout(() => {
        saveRoutineData(updated, dayNotes);
      }, 1200);
    } else {
      saveRoutineData(updated, dayNotes);
    }
  };

  // Copy values from yesterday
  const handleCopyFromYesterday = () => {
    if (Object.keys(yesterdayEntries).length === 0) {
      alert("No routine entries found for yesterday to copy.");
      return;
    }

    const copiedEntries: Record<string, any> = { ...entries };
    for (const hId in yesterdayEntries) {
      const yVal = yesterdayEntries[hId]?.value;
      if (yVal !== undefined && yVal !== null) {
        copiedEntries[hId] = yVal;
      }
    }

    setEntries(copiedEntries);
    saveRoutineData(copiedEntries, dayNotes);
  };

  const isToday = isDateToday(selectedDate);
  const isFuture = isDateInFuture(selectedDate);

  // Group habits by category
  const categories = Array.from(new Set(habits.map((h) => h.category || "General")));

  // Calculate day completion count
  const applicableHabits = habits.filter(
    (h) => isHabitApplicableOnDate(h, selectedDate) && h.is_completion_metric
  );
  let completedCount = 0;
  for (const h of applicableHabits) {
    if (determineEntryCompletion(h, entries[h.id])) {
      completedCount++;
    }
  }
  const completionPercentage =
    applicableHabits.length > 0
      ? Math.round((completedCount / applicableHabits.length) * 100)
      : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Date Selector & Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              aria-label="Previous day"
              className="p-2 rounded-lg border border-border-subtle bg-surface text-charcoal hover:bg-page transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-charcoal">
                  {formatDisplayDate(selectedDate)}
                </h1>
                {isToday && <Badge variant="sage">Today</Badge>}
                {isFuture && <Badge variant="outline">Upcoming</Badge>}
              </div>
              <span className="text-xs text-charcoal-muted mt-0.5">
                {applicableHabits.length} applicable routines • {completedCount} completed ({completionPercentage}%)
              </span>
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              aria-label="Next day"
              className="p-2 rounded-lg border border-border-subtle bg-surface text-charcoal hover:bg-page transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(getTodayDateString())}
              >
                Go to Today
              </Button>
            )}

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="h-9 px-3 text-xs rounded-md border border-border-subtle bg-white text-charcoal shadow-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyFromYesterday}
              className="gap-1.5"
              title="Copy habit entries from yesterday"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy Yesterday</span>
            </Button>

            <Button
              size="sm"
              onClick={() => saveRoutineData()}
              isLoading={saveStatus === "saving"}
              className="gap-1.5 shadow-subtle"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          </div>
        </div>

        {/* Save Status Banner */}
        <div className="flex items-center justify-between text-xs h-6 px-1">
          {saveStatus === "saving" && (
            <span className="text-charcoal-muted flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Saving changes to cloud...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-status-success flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All changes saved to PostgreSQL
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-status-error flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errorMessage || "Save failed. Check your connection."}
            </span>
          )}
          {saveStatus === "idle" && (
            <span className="text-charcoal-muted">
              Auto-saves as you enter or check items
            </span>
          )}

          {/* Quick Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-charcoal-muted font-medium">
              {completionPercentage}% complete
            </span>
            <div className="w-24 bg-sage-light rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-forest h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Habits Categorized Entry Form */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-charcoal-muted">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent mx-auto mb-2" />
            Loading routine items...
          </div>
        ) : habits.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="h-8 w-8 text-forest mx-auto mb-2" />
            <h3 className="text-base font-semibold text-charcoal">No Habits Configured</h3>
            <p className="text-xs text-charcoal-muted mt-1 max-w-sm mx-auto">
              You haven't configured any habits yet. Go to Manage Habits to set up your routine tracking fields.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const catHabits = habits.filter((h) => (h.category || "General") === category);
              if (catHabits.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-forest px-1">
                    {category}
                  </h2>

                  <div className="space-y-3">
                    {catHabits.map((habit) => {
                      const isApplicable = isHabitApplicableOnDate(habit, selectedDate);
                      const currentVal = entries[habit.id];
                      const isCompleted = determineEntryCompletion(habit, currentVal);

                      return (
                        <div
                          key={habit.id}
                          className={`rounded-lg border p-4 transition-all duration-150 ${
                            !isApplicable
                              ? "opacity-60 bg-page/70 border-border-subtle"
                              : isCompleted
                              ? "bg-white border-green-200 shadow-xs ring-1 ring-green-100"
                              : "bg-white border-border-subtle hover:border-border shadow-xs"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Habit Info & Label */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {/* Quick checkbox toggle for checkbox or simple habits */}
                              {habit.field_type === "checkbox" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextCompleted = !isCompleted;
                                    handleEntryChange(habit.id, {
                                      ...(typeof currentVal === "object" ? currentVal : {}),
                                      completed: nextCompleted,
                                    });
                                  }}
                                  className={`mt-0.5 h-6 w-6 rounded flex items-center justify-center border transition-all ${
                                    isCompleted
                                      ? "bg-forest border-forest text-white"
                                      : "border-border-strong bg-white hover:border-forest"
                                  }`}
                                  aria-label={`Mark ${habit.name} ${isCompleted ? "incomplete" : "complete"}`}
                                >
                                  {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                                </button>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-charcoal">
                                    {habit.name}
                                  </span>
                                  {habit.target_value && (
                                    <span className="text-[11px] text-charcoal-muted bg-sage px-2 py-0.5 rounded">
                                      Target:{" "}
                                      {typeof habit.target_value === "object"
                                        ? habit.target_value.duration
                                          ? `${habit.target_value.duration} mins`
                                          : JSON.stringify(habit.target_value)
                                        : String(habit.target_value)}
                                    </span>
                                  )}
                                  {!isApplicable && (
                                    <span className="text-[10px] text-charcoal-muted italic">
                                      (Not scheduled today)
                                    </span>
                                  )}
                                </div>
                                {habit.description && (
                                  <p className="text-xs text-charcoal-muted mt-0.5">
                                    {habit.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Habit Input Controls */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[220px]">
                              {/* 1. TIME PICKER */}
                              {habit.field_type === "time" && (
                                <div className="flex items-center gap-2 w-full">
                                  <Clock className="h-4 w-4 text-charcoal-muted shrink-0" />
                                  <input
                                    type="time"
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.time || ""
                                        : currentVal || ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(habit.id, {
                                        ...(typeof currentVal === "object" ? currentVal : {}),
                                        time: e.target.value,
                                      })
                                    }
                                    className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest"
                                  />
                                </div>
                              )}

                              {/* 2. DURATION INPUT */}
                              {habit.field_type === "duration" && (
                                <div className="flex items-center gap-1.5 w-full">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Duration"
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.duration ?? ""
                                        : currentVal ?? ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(
                                        habit.id,
                                        {
                                          ...(typeof currentVal === "object" ? currentVal : {}),
                                          duration: e.target.value ? Number(e.target.value) : "",
                                        },
                                        true
                                      )
                                    }
                                    className="h-9 text-xs"
                                  />
                                  <span className="text-xs text-charcoal-muted shrink-0">
                                    {habit.config?.duration_unit || "mins"}
                                  </span>
                                </div>
                              )}

                              {/* 3. NUMBER INPUT */}
                              {habit.field_type === "number" && (
                                <div className="flex items-center gap-1.5 w-full">
                                  <Input
                                    type="number"
                                    min={habit.config?.min ?? 0}
                                    max={habit.config?.max}
                                    step={habit.config?.step ?? 1}
                                    placeholder={habit.config?.placeholder || "0"}
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.number ?? ""
                                        : currentVal ?? ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(
                                        habit.id,
                                        {
                                          ...(typeof currentVal === "object" ? currentVal : {}),
                                          number: e.target.value ? Number(e.target.value) : "",
                                        },
                                        true
                                      )
                                    }
                                    className="h-9 text-xs"
                                  />
                                  {habit.config?.unit && (
                                    <span className="text-xs text-charcoal-muted shrink-0">
                                      {habit.config.unit}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 4. URL INPUT */}
                              {habit.field_type === "url" && (
                                <div className="space-y-1.5 w-full">
                                  <Input
                                    type="url"
                                    placeholder={habit.config?.placeholder || "https://..."}
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.url || ""
                                        : currentVal || ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(
                                        habit.id,
                                        {
                                          ...(typeof currentVal === "object" ? currentVal : {}),
                                          url: e.target.value,
                                        },
                                        true
                                      )
                                    }
                                    className="h-9 text-xs"
                                  />
                                  {habit.config?.allow_title && (
                                    <Input
                                      type="text"
                                      placeholder="Video / Link title (optional)"
                                      value={currentVal?.title || ""}
                                      onChange={(e) =>
                                        handleEntryChange(
                                          habit.id,
                                          {
                                            ...(typeof currentVal === "object" ? currentVal : {}),
                                            title: e.target.value,
                                          },
                                          true
                                        )
                                      }
                                      className="h-8 text-xs"
                                    />
                                  )}
                                </div>
                              )}

                              {/* 5. SELECT / DROPDOWN */}
                              {habit.field_type === "select" && (
                                <select
                                  value={
                                    typeof currentVal === "object"
                                      ? currentVal?.selected || ""
                                      : currentVal || ""
                                  }
                                  onChange={(e) =>
                                    handleEntryChange(habit.id, {
                                      ...(typeof currentVal === "object" ? currentVal : {}),
                                      selected: e.target.value,
                                    })
                                  }
                                  className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest"
                                >
                                  <option value="">Select option...</option>
                                  {habit.config?.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* 6. TEXT / NOTE / MEAL INPUT */}
                              {habit.field_type === "text" && (
                                <div className="space-y-1.5 w-full">
                                  <Input
                                    type="text"
                                    placeholder={habit.config?.placeholder || "Enter details..."}
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.text || ""
                                        : currentVal || ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(
                                        habit.id,
                                        {
                                          ...(typeof currentVal === "object" ? currentVal : {}),
                                          text: e.target.value,
                                        },
                                        true
                                      )
                                    }
                                    className="h-9 text-xs"
                                  />
                                  {habit.config?.has_duration && (
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Duration"
                                        value={currentVal?.duration ?? ""}
                                        onChange={(e) =>
                                          handleEntryChange(
                                            habit.id,
                                            {
                                              ...(typeof currentVal === "object" ? currentVal : {}),
                                              duration: e.target.value ? Number(e.target.value) : "",
                                            },
                                            true
                                          )
                                        }
                                        className="h-8 text-xs w-28"
                                      />
                                      <span className="text-[11px] text-charcoal-muted">
                                        mins
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Extra duration for checkbox habits like workout or walk */}
                              {habit.field_type === "checkbox" && habit.config?.has_duration && (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={String(habit.config.default_duration || "15")}
                                    value={
                                      typeof currentVal === "object"
                                        ? currentVal?.duration ?? ""
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleEntryChange(
                                        habit.id,
                                        {
                                          ...(typeof currentVal === "object" ? currentVal : {}),
                                          duration: e.target.value ? Number(e.target.value) : "",
                                          completed: true,
                                        },
                                        true
                                      )
                                    }
                                    className="h-9 text-xs w-24"
                                  />
                                  <span className="text-[11px] text-charcoal-muted shrink-0">
                                    mins
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Optional Quick Notes for habit */}
                          {habit.config?.allow_notes && (
                            <div className="mt-2.5 pt-2 border-t border-border-subtle/40">
                              <input
                                type="text"
                                placeholder={
                                  habit.config?.notes_placeholder || "Add optional note..."
                                }
                                value={currentVal?.notes || ""}
                                onChange={(e) =>
                                  handleEntryChange(
                                    habit.id,
                                    {
                                      ...(typeof currentVal === "object" ? currentVal : {}),
                                      notes: e.target.value,
                                    },
                                    true
                                  )
                                }
                                className="w-full text-xs text-charcoal-muted/80 bg-transparent placeholder:text-charcoal-muted/40 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Daily Overall Notes */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Reflections & Notes</CardTitle>
                <p className="text-xs text-charcoal-muted">
                  Record overall thoughts, health symptoms, energy level, or daily review
                </p>
              </CardHeader>
              <CardContent>
                <textarea
                  rows={3}
                  value={dayNotes}
                  onChange={(e) => {
                    setDayNotes(e.target.value);
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                    saveTimeoutRef.current = setTimeout(() => {
                      saveRoutineData(entries, e.target.value);
                    }, 1200);
                  }}
                  placeholder="How did today feel? Any blockers or accomplishments?"
                  className="w-full rounded-md border border-border-subtle bg-white p-3 text-xs text-charcoal shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
