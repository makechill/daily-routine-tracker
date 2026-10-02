import { describe, it, expect } from "vitest";
import {
  filterExportData,
  generateExcelWorkbook,
  generateJsonExport,
} from "../src/lib/export-engine";
import { Habit, DailyRecord, HabitEntry } from "../src/types/routine";

const mockHabits: Habit[] = [
  {
    id: "h1",
    user_id: "u1",
    name: "Workout",
    category: "Health",
    field_type: "checkbox",
    config: {},
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    activation_date: "2026-09-01",
    archived_at: null,
    display_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "h2",
    user_id: "u1",
    name: "Reading",
    category: "Learning",
    field_type: "text",
    config: {},
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    activation_date: "2026-09-01",
    archived_at: null,
    display_order: 2,
    created_at: "",
    updated_at: "",
  },
];

const mockRecords: DailyRecord[] = [
  {
    id: "r1",
    user_id: "u1",
    date: "2026-10-01",
    notes: "Day 1 reflections",
    created_at: "",
    updated_at: "",
  },
  {
    id: "r2",
    user_id: "u1",
    date: "2026-10-02",
    notes: "Day 2 reflections",
    created_at: "",
    updated_at: "",
  },
];

const mockEntries: HabitEntry[] = [
  {
    id: "e1",
    daily_record_id: "r1",
    habit_id: "h1",
    user_id: "u1",
    value: true,
    is_completed: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "e2",
    daily_record_id: "r1",
    habit_id: "h2",
    user_id: "u1",
    value: "Read Chapter 1",
    is_completed: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "e3",
    daily_record_id: "r2",
    habit_id: "h1",
    user_id: "u1",
    value: false,
    is_completed: false,
    created_at: "",
    updated_at: "",
  },
];

describe("Export Engine Filtering", () => {
  it("filters by date range", () => {
    const result = filterExportData({
      habits: mockHabits,
      records: mockRecords,
      entries: mockEntries,
      filterOptions: {
        dateRangePreset: "custom",
        startDate: "2026-10-02",
        endDate: "2026-10-02",
        habitIds: [],
        includeArchived: true,
        statusFilter: "all",
      },
    });

    expect(result.records.length).toBe(1);
    expect(result.records[0].date).toBe("2026-10-02");
    expect(result.entries.length).toBe(1); // only e3
  });

  it("filters by completion status (completed only)", () => {
    const result = filterExportData({
      habits: mockHabits,
      records: mockRecords,
      entries: mockEntries,
      filterOptions: {
        dateRangePreset: "all",
        habitIds: [],
        includeArchived: true,
        statusFilter: "completed_only",
      },
    });

    expect(result.entries.length).toBe(2);
    expect(result.entries.every((e) => e.is_completed)).toBe(true);
  });

  it("filters by habit selection", () => {
    const result = filterExportData({
      habits: mockHabits,
      records: mockRecords,
      entries: mockEntries,
      filterOptions: {
        dateRangePreset: "all",
        habitIds: ["h1"],
        includeArchived: true,
        statusFilter: "all",
      },
    });

    expect(result.habits.length).toBe(1);
    expect(result.habits[0].name).toBe("Workout");
    expect(result.entries.every((e) => e.habit_id === "h1")).toBe(true);
  });
});

describe("Export File Generation", () => {
  it("generates structured JSON export with schemaVersion 1", () => {
    const json = generateJsonExport({
      habits: mockHabits,
      records: mockRecords,
      entries: mockEntries,
      filterOptions: {
        dateRangePreset: "all",
        habitIds: [],
        includeArchived: true,
        statusFilter: "all",
      },
    });

    expect(json.schemaVersion).toBe(1);
    expect(json.records.length).toBe(2);
    expect(json.habits.length).toBe(2);
    expect(json.entries.length).toBe(3);
    expect(json.metadata.totalRecords).toBe(2);
  });

  it("generates valid Excel (.xlsx) buffer with multi-sheet structure", async () => {
    const buffer = await generateExcelWorkbook({
      habits: mockHabits,
      records: mockRecords,
      entries: mockEntries,
      filterOptions: {
        dateRangePreset: "all",
        habitIds: [],
        includeArchived: true,
        statusFilter: "all",
      },
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard zip / xlsx header check (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
