import { z } from "zod";
import { Habit, DailyRecord, HabitEntry } from "@/types/routine";

export const JsonImportSchema = z.object({
  schemaVersion: z.number().int().min(1).max(1),
  exportedAt: z.string(),
  timezone: z.string().optional(),
  habits: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable().optional(),
      category: z.string(),
      field_type: z.enum([
        "checkbox",
        "time",
        "text",
        "number",
        "duration",
        "url",
        "select",
        "date",
      ]),
      config: z.record(z.string(), z.any()).optional().default({}),
      target_value: z.any().optional(),
      is_completion_metric: z.boolean().optional().default(true),
      is_required: z.boolean().optional().default(false),
      applicable_days: z.array(z.number()).optional().default([0, 1, 2, 3, 4, 5, 6]),
      activation_date: z.string().optional(),
      archived_at: z.string().nullable().optional(),
      display_order: z.number().optional().default(0),
    })
  ),
  records: z.array(
    z.object({
      id: z.string().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notes: z.string().nullable().optional(),
    })
  ),
  entries: z.array(
    z.object({
      id: z.string().optional(),
      daily_record_id: z.string().optional(),
      habit_id: z.string(),
      value: z.any(),
      notes: z.string().nullable().optional(),
      is_completed: z.boolean().optional().default(false),
      completed_at: z.string().nullable().optional(),
      // Some imports might specify date directly for portability
      date: z.string().optional(),
    })
  ),
});

export type ValidatedJsonImport = z.infer<typeof JsonImportSchema>;

export interface ImportPreviewResult {
  valid: boolean;
  errors?: string[];
  schemaVersion?: number;
  totalHabits: number;
  totalRecords: number;
  totalEntries: number;
  dateRange: { start: string; end: string };
  conflictingDatesCount: number;
  newDatesCount: number;
  conflictingHabitsCount: number;
  newHabitsCount: number;
  validatedData?: ValidatedJsonImport;
}

/**
 * Validates raw JSON string or object and compares against existing user habits and records.
 */
export function validateAndPreviewImport(
  rawJson: string | object,
  existingHabitIds: Set<string>,
  existingDates: Set<string>
): ImportPreviewResult {
  try {
    let parsed: any;
    if (typeof rawJson === "string") {
      parsed = JSON.parse(rawJson);
    } else {
      parsed = rawJson;
    }

    const parseResult = JsonImportSchema.safeParse(parsed);
    if (!parseResult.success) {
      return {
        valid: false,
        errors: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        totalHabits: 0,
        totalRecords: 0,
        totalEntries: 0,
        dateRange: { start: "", end: "" },
        conflictingDatesCount: 0,
        newDatesCount: 0,
        conflictingHabitsCount: 0,
        newHabitsCount: 0,
      };
    }

    const data = parseResult.data;

    let conflictingHabitsCount = 0;
    let newHabitsCount = 0;
    for (const h of data.habits) {
      if (existingHabitIds.has(h.id)) {
        conflictingHabitsCount++;
      } else {
        newHabitsCount++;
      }
    }

    let conflictingDatesCount = 0;
    let newDatesCount = 0;
    const dates = data.records.map((r) => r.date).sort();
    for (const d of dates) {
      if (existingDates.has(d)) {
        conflictingDatesCount++;
      } else {
        newDatesCount++;
      }
    }

    return {
      valid: true,
      schemaVersion: data.schemaVersion,
      totalHabits: data.habits.length,
      totalRecords: data.records.length,
      totalEntries: data.entries.length,
      dateRange: {
        start: dates[0] || "",
        end: dates[dates.length - 1] || "",
      },
      conflictingDatesCount,
      newDatesCount,
      conflictingHabitsCount,
      newHabitsCount,
      validatedData: data,
    };
  } catch (err: any) {
    return {
      valid: false,
      errors: [err.message || "Invalid JSON syntax"],
      totalHabits: 0,
      totalRecords: 0,
      totalEntries: 0,
      dateRange: { start: "", end: "" },
      conflictingDatesCount: 0,
      newDatesCount: 0,
      conflictingHabitsCount: 0,
      newHabitsCount: 0,
    };
  }
}
