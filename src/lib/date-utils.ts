/**
 * Timezone-aware date utilities for Personal Daily Routine Tracker.
 * Default timezone: Asia/Kolkata.
 * Prevents UTC day-shift bugs by generating and parsing local calendar dates explicitly.
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date formatted as YYYY-MM-DD in the specified timezone.
 */
export function getTodayDateString(timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if timezone is invalid
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Formats a YYYY-MM-DD date into human-readable format (e.g. "Friday, 2 Oct 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a YYYY-MM-DD date into a compact format (e.g. "Oct 02, 2026").
 */
export function formatCompactDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/**
 * Checks if a given date string (YYYY-MM-DD) is in the future relative to the given timezone.
 */
export function isDateInFuture(dateStr: string, timeZone: string = DEFAULT_TIMEZONE): boolean {
  const todayStr = getTodayDateString(timeZone);
  return dateStr > todayStr;
}

/**
 * Checks if a date string is today.
 */
export function isDateToday(dateStr: string, timeZone: string = DEFAULT_TIMEZONE): boolean {
  return dateStr === getTodayDateString(timeZone);
}

/**
 * Adds or subtracts days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Generates an array of YYYY-MM-DD date strings between start and end date (inclusive).
 */
export function getDateRangeArray(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

/**
 * Returns preset date ranges (today, week, month, past 30 days).
 */
export function getPresetDateRange(
  preset: "today" | "week" | "month" | "all" | "past30",
  timeZone: string = DEFAULT_TIMEZONE
): { start: string; end: string } {
  const today = getTodayDateString(timeZone);
  const [year, month, day] = today.split("-").map(Number);
  const currentDate = new Date(year, month - 1, day);

  if (preset === "today") {
    return { start: today, end: today };
  }

  if (preset === "past30") {
    return { start: addDays(today, -29), end: today };
  }

  if (preset === "week") {
    // Current week starting on Monday
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = addDays(today, -distanceToMonday);
    const sunday = addDays(monday, 6);
    return { start: monday, end: sunday };
  }

  if (preset === "month") {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    return { start, end };
  }

  // Fallback for "all"
  return { start: "2024-01-01", end: today };
}
