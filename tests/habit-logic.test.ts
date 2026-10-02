import { describe, it, expect } from "vitest";
import {
  isHabitApplicableOnDate,
  determineEntryCompletion,
  calculateDayCompletion,
  calculateHabitStreaks,
} from "../src/lib/habit-logic";
import { Habit, HabitEntry } from "../src/types/routine";

const mockHabit: Habit = {
  id: "h1",
  user_id: "u1",
  name: "Morning Workout",
  category: "Health & Fitness",
  field_type: "checkbox",
  config: { has_duration: true },
  target_value: { completed: true, duration: 30 },
  is_completion_metric: true,
  is_required: false,
  applicable_days: [1, 2, 3, 4, 5], // Monday through Friday
  activation_date: "2026-10-01",
  archived_at: null,
  display_order: 1,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

describe("Habit Applicability Rules", () => {
  it("does not apply before activation date", () => {
    expect(isHabitApplicableOnDate(mockHabit, "2026-09-30")).toBe(false);
  });

  it("applies on or after activation date if scheduled", () => {
    // 2026-10-02 is Friday (day 5) -> scheduled
    expect(isHabitApplicableOnDate(mockHabit, "2026-10-02")).toBe(true);
  });

  it("does not apply on non-scheduled days of the week", () => {
    // 2026-10-04 is Sunday (day 0) -> not in [1, 2, 3, 4, 5]
    expect(isHabitApplicableOnDate(mockHabit, "2026-10-04")).toBe(false);
  });

  it("does not apply on dates after archiving", () => {
    const archivedHabit: Habit = {
      ...mockHabit,
      archived_at: "2026-10-02T12:00:00Z",
    };
    expect(isHabitApplicableOnDate(archivedHabit, "2026-10-01")).toBe(true);
    expect(isHabitApplicableOnDate(archivedHabit, "2026-10-05")).toBe(false);
  });
});

describe("Entry Completion Determination", () => {
  it("evaluates checkbox completion properly", () => {
    expect(determineEntryCompletion({ ...mockHabit, field_type: "checkbox" }, true)).toBe(true);
    expect(determineEntryCompletion({ ...mockHabit, field_type: "checkbox" }, false)).toBe(false);
    expect(
      determineEntryCompletion(
        { ...mockHabit, field_type: "checkbox" },
        { completed: true, duration: 45 }
      )
    ).toBe(true);
    expect(
      determineEntryCompletion(
        { ...mockHabit, field_type: "checkbox" },
        { completed: false }
      )
    ).toBe(false);
  });

  it("evaluates time completion properly", () => {
    const timeHabit = { ...mockHabit, field_type: "time" as const };
    expect(determineEntryCompletion(timeHabit, "07:15")).toBe(true);
    expect(determineEntryCompletion(timeHabit, { time: "06:45" })).toBe(true);
    expect(determineEntryCompletion(timeHabit, "")).toBe(false);
    expect(determineEntryCompletion(timeHabit, null)).toBe(false);
  });

  it("evaluates text completion properly", () => {
    const textHabit = { ...mockHabit, field_type: "text" as const };
    expect(determineEntryCompletion(textHabit, "Oatmeal with blueberries")).toBe(true);
    expect(determineEntryCompletion(textHabit, { text: "Salad" })).toBe(true);
    expect(determineEntryCompletion(textHabit, "   ")).toBe(false);
    expect(determineEntryCompletion(textHabit, null)).toBe(false);
  });

  it("evaluates number and duration completion properly", () => {
    const numHabit = {
      ...mockHabit,
      field_type: "number" as const,
      config: { min_completion_value: 5 },
    };
    expect(determineEntryCompletion(numHabit, 8)).toBe(true);
    expect(determineEntryCompletion(numHabit, 4)).toBe(false);

    const durHabit = { ...mockHabit, field_type: "duration" as const };
    expect(determineEntryCompletion(durHabit, 30)).toBe(true);
    expect(determineEntryCompletion(durHabit, 0)).toBe(false);
  });

  it("evaluates url completion properly", () => {
    const urlHabit = { ...mockHabit, field_type: "url" as const };
    expect(determineEntryCompletion(urlHabit, "https://youtube.com/watch?v=123")).toBe(true);
    expect(determineEntryCompletion(urlHabit, "not a url")).toBe(false);
  });
});

describe("Day Completion Percentage Calculations", () => {
  const habits: Habit[] = [
    { ...mockHabit, id: "h1", applicable_days: [0, 1, 2, 3, 4, 5, 6] },
    { ...mockHabit, id: "h2", applicable_days: [0, 1, 2, 3, 4, 5, 6] },
    { ...mockHabit, id: "h3", is_completion_metric: false, applicable_days: [0, 1, 2, 3, 4, 5, 6] },
  ];

  it("calculates 50% when 1 of 2 metric habits is completed", () => {
    const entries: Record<string, HabitEntry> = {
      h1: {
        id: "e1",
        daily_record_id: "r1",
        habit_id: "h1",
        user_id: "u1",
        value: true,
        is_completed: true,
        created_at: "",
        updated_at: "",
      },
    };

    const stats = calculateDayCompletion(habits, entries, "2026-10-02");
    expect(stats.applicableHabitsCount).toBe(2);
    expect(stats.completedHabitsCount).toBe(1);
    expect(stats.percentage).toBe(50);
  });

  it("handles empty applicable habits gracefully without division by zero", () => {
    const stats = calculateDayCompletion([], {}, "2026-10-02");
    expect(stats.applicableHabitsCount).toBe(0);
    expect(stats.completedHabitsCount).toBe(0);
    expect(stats.percentage).toBe(0);
  });
});

describe("Streak Calculations", () => {
  it("calculates active streaks correctly across scheduled days", () => {
    const habit: Habit = {
      ...mockHabit,
      id: "h_streak",
      applicable_days: [0, 1, 2, 3, 4, 5, 6],
      activation_date: "2026-09-01",
    };

    const entriesMap = new Map<string, HabitEntry | undefined>();
    // Past 3 days completed
    const today = "2026-10-02";
    entriesMap.set("2026-10-02", { is_completed: true } as any);
    entriesMap.set("2026-10-01", { is_completed: true } as any);
    entriesMap.set("2026-09-30", { is_completed: true } as any);
    entriesMap.set("2026-09-29", { is_completed: false } as any);

    const stats = calculateHabitStreaks(habit, entriesMap, "Asia/Kolkata");
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.totalCompletions).toBe(3);
  });
});
