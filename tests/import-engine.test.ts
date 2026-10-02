import { describe, it, expect } from "vitest";
import { validateAndPreviewImport } from "../src/lib/import-engine";

describe("JSON Import & Restore Validation", () => {
  const validExport = {
    schemaVersion: 1,
    exportedAt: "2026-10-02T12:00:00Z",
    timezone: "Asia/Kolkata",
    habits: [
      {
        id: "h_imported_1",
        name: "Morning Walk",
        category: "Fitness",
        field_type: "checkbox",
        is_completion_metric: true,
      },
    ],
    records: [
      {
        id: "r_imported_1",
        date: "2026-10-01",
        notes: "Good start",
      },
      {
        id: "r_imported_2",
        date: "2026-10-02",
        notes: "Great day",
      },
    ],
    entries: [
      {
        habit_id: "h_imported_1",
        daily_record_id: "r_imported_1",
        value: true,
        is_completed: true,
      },
    ],
  };

  it("successfully validates and previews valid routine backup", () => {
    const existingHabits = new Set(["h_other"]);
    const existingDates = new Set(["2026-10-01"]); // 1 conflict, 1 new date

    const preview = validateAndPreviewImport(validExport, existingHabits, existingDates);

    expect(preview.valid).toBe(true);
    expect(preview.totalHabits).toBe(1);
    expect(preview.totalRecords).toBe(2);
    expect(preview.conflictingDatesCount).toBe(1);
    expect(preview.newDatesCount).toBe(1);
    expect(preview.conflictingHabitsCount).toBe(0);
    expect(preview.newHabitsCount).toBe(1);
    expect(preview.dateRange.start).toBe("2026-10-01");
    expect(preview.dateRange.end).toBe("2026-10-02");
  });

  it("rejects invalid schema or malformed syntax", () => {
    const invalidSchema = {
      schemaVersion: 999, // unsupported
      habits: "invalid",
    };

    const preview = validateAndPreviewImport(invalidSchema, new Set(), new Set());
    expect(preview.valid).toBe(false);
    expect(preview.errors).toBeDefined();
    expect(preview.errors!.length).toBeGreaterThan(0);
  });

  it("rejects corrupted JSON string safely", () => {
    const preview = validateAndPreviewImport("{ corrupted json [", new Set(), new Set());
    expect(preview.valid).toBe(false);
    expect(preview.errors![0]).toContain("JSON");
  });
});
