import { describe, it, expect } from "vitest";
import {
  getTodayDateString,
  formatDisplayDate,
  getDayOfWeek,
  isDateInFuture,
  isDateToday,
  addDays,
  getDateRangeArray,
  getPresetDateRange,
} from "../src/lib/date-utils";

describe("Timezone-Safe Date Utilities", () => {
  it("generates valid YYYY-MM-DD format for Asia/Kolkata", () => {
    const today = getTodayDateString("Asia/Kolkata");
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("correctly identifies future and past dates", () => {
    const today = getTodayDateString("Asia/Kolkata");
    const futureDate = addDays(today, 5);
    const pastDate = addDays(today, -5);

    expect(isDateInFuture(futureDate, "Asia/Kolkata")).toBe(true);
    expect(isDateInFuture(pastDate, "Asia/Kolkata")).toBe(false);
    expect(isDateInFuture(today, "Asia/Kolkata")).toBe(false);
    expect(isDateToday(today, "Asia/Kolkata")).toBe(true);
    expect(isDateToday(pastDate, "Asia/Kolkata")).toBe(false);
  });

  it("calculates correct day of week", () => {
    // 2026-10-02 is a Friday -> index 5
    expect(getDayOfWeek("2026-10-02")).toBe(5);
    // 2026-10-04 is a Sunday -> index 0
    expect(getDayOfWeek("2026-10-04")).toBe(0);
  });

  it("generates consecutive date ranges without UTC shift bugs", () => {
    const range = getDateRangeArray("2026-10-01", "2026-10-04");
    expect(range).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("formats dates into readable human strings", () => {
    const formatted = formatDisplayDate("2026-10-02");
    expect(formatted).toContain("Oct");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Friday");
  });

  it("provides valid preset ranges for week and month", () => {
    const week = getPresetDateRange("week", "Asia/Kolkata");
    expect(week.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(week.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(week.start <= week.end).toBe(true);

    const month = getPresetDateRange("month", "Asia/Kolkata");
    expect(month.start.endsWith("-01")).toBe(true);
  });
});
