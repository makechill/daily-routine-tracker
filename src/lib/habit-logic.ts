import { Habit, HabitEntry, DayCompletionStats, HabitStreakStats } from "@/types/routine";
import { getDayOfWeek, isDateInFuture, addDays, getTodayDateString, DEFAULT_TIMEZONE } from "./date-utils";

/**
 * Checks if a habit is applicable on a specific calendar date.
 */
export function isHabitApplicableOnDate(habit: Habit, dateStr: string): boolean {
  // 1. Must be activated on or before this date
  if (habit.activation_date && dateStr < habit.activation_date) {
    return false;
  }

  // 2. If archived, check archive date
  if (habit.archived_at) {
    const archiveDateStr = habit.archived_at.slice(0, 10);
    if (dateStr > archiveDateStr) {
      return false;
    }
  }

  // 3. Must be scheduled on this day of the week
  const dayOfWeek = getDayOfWeek(dateStr);
  if (Array.isArray(habit.applicable_days) && habit.applicable_days.length > 0) {
    if (!habit.applicable_days.includes(dayOfWeek)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates whether an entry meets completion criteria for its habit definition.
 */
export function determineEntryCompletion(habit: Habit, value: any): boolean {
  if (value === null || value === undefined) return false;

  switch (habit.field_type) {
    case "checkbox": {
      if (typeof value === "boolean") return value;
      if (typeof value === "object") {
        return Boolean(value.completed);
      }
      return false;
    }

    case "time": {
      const timeVal = typeof value === "object" ? value.time : value;
      return typeof timeVal === "string" && timeVal.trim().length > 0;
    }

    case "text": {
      const textVal = typeof value === "object" ? value.text : value;
      return typeof textVal === "string" && textVal.trim().length > 0;
    }

    case "number": {
      const numVal = typeof value === "object" ? value.number : Number(value);
      if (typeof numVal !== "number" || isNaN(numVal)) return false;
      const min = habit.config?.min_completion_value ?? 1;
      return numVal >= min;
    }

    case "duration": {
      const durVal = typeof value === "object" ? value.duration : Number(value);
      if (typeof durVal !== "number" || isNaN(durVal)) return false;
      return durVal > 0;
    }

    case "url": {
      const urlVal = typeof value === "object" ? value.url : value;
      return typeof urlVal === "string" && urlVal.trim().startsWith("http");
    }

    case "select": {
      const selVal = typeof value === "object" ? value.selected : value;
      return typeof selVal === "string" && selVal.trim().length > 0;
    }

    case "date": {
      const dateVal = typeof value === "object" ? value.date : value;
      return typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal);
    }

    default:
      return false;
  }
}

/**
 * Calculates day completion statistics given habits and recorded entries.
 */
export function calculateDayCompletion(
  habits: Habit[],
  entries: Record<string, HabitEntry>, // keyed by habit_id
  dateStr: string,
  timeZone: string = DEFAULT_TIMEZONE
): DayCompletionStats {
  const isFuture = isDateInFuture(dateStr, timeZone);

  // Filter habits that are applicable on this date and count as metric
  const applicableHabits = habits.filter(
    (h) => isHabitApplicableOnDate(h, dateStr) && h.is_completion_metric
  );

  const applicableHabitsCount = applicableHabits.length;

  if (applicableHabitsCount === 0) {
    return {
      date: dateStr,
      applicableHabitsCount: 0,
      completedHabitsCount: 0,
      percentage: 0,
      isFuture,
    };
  }

  let completedHabitsCount = 0;
  for (const habit of applicableHabits) {
    const entry = entries[habit.id];
    if (entry && entry.is_completed) {
      completedHabitsCount++;
    }
  }

  const percentage = Math.round((completedHabitsCount / applicableHabitsCount) * 100);

  return {
    date: dateStr,
    applicableHabitsCount,
    completedHabitsCount,
    percentage,
    isFuture,
  };
}

/**
 * Calculates per-habit streak information across historical entries.
 */
export function calculateHabitStreaks(
  habit: Habit,
  dateToEntryMap: Map<string, HabitEntry | undefined>, // dateStr -> entry
  timeZone: string = DEFAULT_TIMEZONE
): HabitStreakStats {
  const today = getTodayDateString(timeZone);
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let totalCompletions = 0;
  let totalApplicableDays = 0;

  // Scan backwards from today or yesterday to find current streak
  let checkingCurrentStreak = true;

  // Check if today is applicable; if incomplete, current streak can still be active from yesterday
  const todayEntry = dateToEntryMap.get(today);
  const todayIsApplicable = isHabitApplicableOnDate(habit, today);
  const todayCompleted = Boolean(todayEntry?.is_completed);

  if (todayIsApplicable) {
    totalApplicableDays++;
    if (todayCompleted) {
      currentStreak++;
      totalCompletions++;
    } else {
      // If today is not yet completed, don't break current streak yet, check from yesterday!
    }
  }

  // Scan past 365 days
  for (let i = 1; i <= 365; i++) {
    const pastDate = addDays(today, -i);
    // Don't check before activation date
    if (habit.activation_date && pastDate < habit.activation_date) {
      break;
    }

    const isApplicable = isHabitApplicableOnDate(habit, pastDate);
    if (!isApplicable) {
      // Habit was not scheduled on this day, so it doesn't break the streak
      continue;
    }

    totalApplicableDays++;
    const entry = dateToEntryMap.get(pastDate);
    const completed = Boolean(entry?.is_completed);

    if (completed) {
      totalCompletions++;
      if (checkingCurrentStreak) {
        currentStreak++;
      }
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      checkingCurrentStreak = false;
      runningStreak = 0;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const completionRate =
    totalApplicableDays > 0 ? Math.round((totalCompletions / totalApplicableDays) * 100) : 0;

  return {
    habitId: habit.id,
    habitName: habit.name,
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
  };
}
