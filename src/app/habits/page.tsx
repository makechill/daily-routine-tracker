"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  Plus,
  Sliders,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Habit, FieldType } from "@/types/routine";

const FIELD_TYPES: { type: FieldType; label: string; desc: string }[] = [
  { type: "checkbox", label: "Checkbox", desc: "Simple yes/no or completion toggle with optional notes/duration" },
  { type: "time", label: "Time", desc: "Native time picker with target comparison (e.g. Wake/Sleep)" },
  { type: "text", label: "Text / Notes", desc: "Free-form text, meal logging, or reflection" },
  { type: "number", label: "Number", desc: "Numeric count, steps, water glasses, expenses" },
  { type: "duration", label: "Duration", desc: "Minutes or hours tracked" },
  { type: "url", label: "URL Link", desc: "Web link or video upload URL with optional title" },
  { type: "select", label: "Dropdown Select", desc: "Single choice from configured options" },
  { type: "date", label: "Date", desc: "Specific milestone date" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ManageHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [fieldType, setFieldType] = useState<FieldType>("checkbox");
  const [targetValue, setTargetValue] = useState("");
  const [isMetric, setIsMetric] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [applicableDays, setApplicableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [hasDuration, setHasDuration] = useState(false);
  const [allowNotes, setAllowNotes] = useState(false);
  const [selectOptions, setSelectOptions] = useState("");
  const [unit, setUnit] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch habits
  const loadHabits = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
      }
    } catch (err) {
      console.error("Failed to load habits", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const openCreateModal = () => {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setCategory("General");
    setFieldType("checkbox");
    setTargetValue("");
    setIsMetric(true);
    setIsRequired(false);
    setApplicableDays([0, 1, 2, 3, 4, 5, 6]);
    setHasDuration(false);
    setAllowNotes(true);
    setSelectOptions("");
    setUnit("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (h: Habit) => {
    setEditingHabit(h);
    setName(h.name);
    setDescription(h.description || "");
    setCategory(h.category || "General");
    setFieldType(h.field_type);
    setTargetValue(
      typeof h.target_value === "object"
        ? JSON.stringify(h.target_value)
        : String(h.target_value || "")
    );
    setIsMetric(h.is_completion_metric);
    setIsRequired(h.is_required);
    setApplicableDays(h.applicable_days || [0, 1, 2, 3, 4, 5, 6]);
    setHasDuration(Boolean(h.config?.has_duration));
    setAllowNotes(Boolean(h.config?.allow_notes));
    setSelectOptions((h.config?.options || []).join(", "));
    setUnit(h.config?.unit || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleWeekdayToggle = (dayIdx: number) => {
    if (applicableDays.includes(dayIdx)) {
      if (applicableDays.length > 1) {
        setApplicableDays(applicableDays.filter((d) => d !== dayIdx));
      }
    } else {
      setApplicableDays([...applicableDays, dayIdx].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Habit name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const config: any = {
      allow_notes: allowNotes,
    };

    if (hasDuration) {
      config.has_duration = true;
      config.duration_unit = "minutes";
    }

    if (unit.trim()) {
      config.unit = unit.trim();
    }

    if (fieldType === "select" && selectOptions.trim()) {
      config.options = selectOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    let parsedTarget: any = null;
    if (targetValue.trim()) {
      try {
        parsedTarget = JSON.parse(targetValue);
      } catch {
        parsedTarget = targetValue.trim();
      }
    }

    try {
      if (editingHabit) {
        // Update habit
        const res = await fetch(`/api/habits/${editingHabit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            category: category.trim(),
            field_type: fieldType,
            config,
            target_value: parsedTarget,
            is_completion_metric: isMetric,
            is_required: isRequired,
            applicable_days: applicableDays,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
      } else {
        // Create new habit
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            category: category.trim(),
            field_type: fieldType,
            config,
            target_value: parsedTarget,
            is_completion_metric: isMetric,
            is_required: isRequired,
            applicable_days: applicableDays,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Creation failed");
        }
      }

      setIsModalOpen(false);
      await loadHabits();
    } catch (err: any) {
      setFormError(err.message || "Failed to save habit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArchive = async (habit: Habit) => {
    const isArchived = Boolean(habit.archived_at);
    const confirmMsg = isArchived
      ? `Reactivate habit "${habit.name}"? It will reappear on daily routine forms.`
      : `Archive habit "${habit.name}"? Historical entries will be safely preserved in history and exports, but it will no longer appear on daily routines.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archived_at: isArchived ? null : new Date().toISOString(),
        }),
      });
      if (res.ok) {
        await loadHabits();
      }
    } catch (err) {
      console.error("Failed to archive/reactivate habit", err);
    }
  };

  const moveOrder = async (habit: Habit, direction: "up" | "down") => {
    const activeHabits = habits.filter((h) => !h.archived_at);
    const idx = activeHabits.findIndex((h) => h.id === habit.id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === activeHabits.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const targetHabit = activeHabits[targetIdx];

    try {
      await Promise.all([
        fetch(`/api/habits/${habit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: targetHabit.display_order }),
        }),
        fetch(`/api/habits/${targetHabit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: habit.display_order }),
        }),
      ]);
      await loadHabits();
    } catch (err) {
      console.error("Failed to reorder habits", err);
    }
  };

  const activeHabits = habits.filter((h) => !h.archived_at);
  const archivedHabits = habits.filter((h) => Boolean(h.archived_at));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <span className="text-xs font-medium text-forest uppercase tracking-wider">
              Configuration
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Manage Habits & Routines
            </h1>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Dynamically add, customize, reorder, or archive tracking fields with zero code changes
            </p>
          </div>

          <Button onClick={openCreateModal} size="sm" className="gap-1.5 shadow-subtle">
            <Plus className="h-4 w-4" />
            <span>Create New Habit</span>
          </Button>
        </div>

        {/* Active Habits Section */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border-subtle bg-sage/20 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Active Habits ({activeHabits.length})
              </h2>
              <p className="text-xs text-charcoal-muted">
                These fields currently appear on your daily routine form and matrix history
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-charcoal-muted">
              Loading habit definitions...
            </div>
          ) : activeHabits.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-muted">
              No active habits. Click "Create New Habit" to add one!
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {activeHabits.map((habit, index) => (
                <div
                  key={habit.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-page/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        onClick={() => moveOrder(habit, "up")}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded text-charcoal-muted hover:bg-sage disabled:opacity-30 transition-colors"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveOrder(habit, "down")}
                        disabled={index === activeHabits.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-charcoal-muted hover:bg-sage disabled:opacity-30 transition-colors"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-charcoal">
                          {habit.name}
                        </span>
                        <Badge variant="sage">{habit.category}</Badge>
                        <Badge variant="outline">{habit.field_type}</Badge>
                        {habit.is_completion_metric ? (
                          <Badge variant="success">Metric</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </div>
                      {habit.description && (
                        <p className="text-xs text-charcoal-muted mt-1">
                          {habit.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-charcoal-muted mt-1.5 flex-wrap">
                        <span>
                          Days: {habit.applicable_days.map((d) => WEEKDAYS[d]).join(", ")}
                        </span>
                        {habit.target_value && (
                          <span>
                            • Target: {JSON.stringify(habit.target_value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(habit)}
                      className="gap-1 text-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleArchive(habit)}
                      className="gap-1 text-xs text-charcoal-muted hover:text-status-warning"
                      title="Archive this habit (preserves historical data)"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archive</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Archived Habits Section */}
        {archivedHabits.length > 0 && (
          <Card className="p-0 overflow-hidden opacity-90 border-dashed">
            <div className="p-4 border-b border-border-subtle bg-page flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-charcoal">
                  Archived Habits ({archivedHabits.length})
                </h2>
                <p className="text-xs text-charcoal-muted">
                  Historical data remains available in historical records and exports. You can reactivate anytime.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {archivedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-page/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-charcoal line-through">
                        {habit.name}
                      </span>
                      <Badge variant="outline">Archived</Badge>
                      <span className="text-xs text-charcoal-muted">({habit.category})</span>
                    </div>
                    {habit.description && (
                      <p className="text-xs text-charcoal-muted mt-0.5">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleArchive(habit)}
                      className="gap-1 text-xs text-forest hover:text-forest-dark"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reactivate</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Create / Edit Habit Dialog Modal */}
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingHabit ? `Edit Habit: ${editingHabit.name}` : "Create New Habit"}
          description="Configure field type, weekly schedule, category, and target rules"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-2.5 rounded-md bg-status-error-bg text-status-error text-xs border border-red-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Habit Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 10-Minute Meditation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Category
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Mindfulness, Nutrition, Learning"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Description / Help Text
              </label>
              <Input
                type="text"
                placeholder="Optional notes or instructions for this habit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Field Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Field Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FIELD_TYPES.map((ft) => {
                  const isSelected = fieldType === ft.type;
                  return (
                    <button
                      key={ft.type}
                      type="button"
                      onClick={() => setFieldType(ft.type)}
                      className={`p-2.5 text-left rounded-lg border transition-all ${
                        isSelected
                          ? "bg-sage border-forest text-forest font-semibold shadow-xs ring-1 ring-forest/30"
                          : "border-border-subtle bg-white text-charcoal hover:bg-page"
                      }`}
                    >
                      <span className="text-xs block font-medium">{ft.label}</span>
                      <span className="text-[10px] text-charcoal-muted block truncate mt-0.5">
                        {ft.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Type Specific Configurations */}
            {fieldType === "select" && (
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Dropdown Options (comma-separated)
                </label>
                <Input
                  type="text"
                  placeholder="Option 1, Option 2, Option 3"
                  value={selectOptions}
                  onChange={(e) => setSelectOptions(e.target.value)}
                />
              </div>
            )}

            {fieldType === "number" && (
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Unit of Measurement (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. glasses, steps, pages, $"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            )}

            {/* Target Value */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Target Value (optional)
              </label>
              <Input
                type="text"
                placeholder={
                  fieldType === "time"
                    ? "07:00"
                    : fieldType === "duration"
                    ? "30"
                    : "Target goal value"
                }
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
              <span className="text-[10px] text-charcoal-muted mt-0.5 block">
                Target value is compared against actual recorded values in analytics and exports
              </span>
            </div>

            {/* Applicable Days of Week */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Applicable Schedule (Weekly Days)
              </label>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((dayName, idx) => {
                  const isScheduled = applicableDays.includes(idx);
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => handleWeekdayToggle(idx)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        isScheduled
                          ? "bg-forest border-forest text-white"
                          : "bg-white border-border-subtle text-charcoal-muted hover:border-charcoal-muted"
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Completion & Configuration Toggles */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal">
                <input
                  type="checkbox"
                  checked={isMetric}
                  onChange={(e) => setIsMetric(e.target.checked)}
                  className="rounded border-border-strong text-forest focus:ring-forest"
                />
                <span>Contributes to daily completion percentage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal">
                <input
                  type="checkbox"
                  checked={allowNotes}
                  onChange={(e) => setAllowNotes(e.target.checked)}
                  className="rounded border-border-strong text-forest focus:ring-forest"
                />
                <span>Allow optional notes on entry</span>
              </label>

              {(fieldType === "checkbox" || fieldType === "text") && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal">
                  <input
                    type="checkbox"
                    checked={hasDuration}
                    onChange={(e) => setHasDuration(e.target.checked)}
                    className="rounded border-border-strong text-forest focus:ring-forest"
                  />
                  <span>Record duration (in minutes) alongside this habit</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingHabit ? "Save Changes" : "Create Habit"}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
