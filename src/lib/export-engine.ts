import ExcelJS from "exceljs";
import { Habit, DailyRecord, HabitEntry, ExportFilterOptions } from "@/types/routine";
import { formatDisplayDate, DEFAULT_TIMEZONE } from "./date-utils";
import { isHabitApplicableOnDate } from "./habit-logic";

export interface ExportDataPayload {
  habits: Habit[];
  records: DailyRecord[];
  entries: HabitEntry[];
  filterOptions: ExportFilterOptions;
  timezone?: string;
}

/**
 * Filters the data payload according to ExportFilterOptions.
 */
export function filterExportData(payload: ExportDataPayload) {
  const { habits, records, entries, filterOptions } = payload;

  // 1. Filter habits
  let filteredHabits = habits;
  if (!filterOptions.includeArchived) {
    filteredHabits = filteredHabits.filter((h) => !h.archived_at);
  }
  if (filterOptions.habitIds && filterOptions.habitIds.length > 0) {
    const selectedSet = new Set(filterOptions.habitIds);
    filteredHabits = filteredHabits.filter((h) => selectedSet.has(h.id));
  }
  if (filterOptions.category) {
    filteredHabits = filteredHabits.filter(
      (h) => h.category.toLowerCase() === filterOptions.category?.toLowerCase()
    );
  }
  if (filterOptions.searchTerm) {
    const term = filterOptions.searchTerm.toLowerCase();
    filteredHabits = filteredHabits.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        (h.description && h.description.toLowerCase().includes(term))
    );
  }

  const validHabitIdSet = new Set(filteredHabits.map((h) => h.id));

  // 2. Filter records by date range
  let filteredRecords = records;
  if (filterOptions.startDate) {
    filteredRecords = filteredRecords.filter((r) => r.date >= filterOptions.startDate!);
  }
  if (filterOptions.endDate) {
    filteredRecords = filteredRecords.filter((r) => r.date <= filterOptions.endDate!);
  }

  const validRecordIdSet = new Set(filteredRecords.map((r) => r.id));

  // 3. Filter entries
  let filteredEntries = entries.filter(
    (e) => validRecordIdSet.has(e.daily_record_id) && validHabitIdSet.has(e.habit_id)
  );

  // Status filter
  if (filterOptions.statusFilter === "completed_only") {
    filteredEntries = filteredEntries.filter((e) => e.is_completed);
  } else if (filterOptions.statusFilter === "incomplete_only") {
    filteredEntries = filteredEntries.filter((e) => !e.is_completed);
  }

  return {
    habits: filteredHabits,
    records: filteredRecords,
    entries: filteredEntries,
  };
}

/**
 * Generates an ExcelJS workbook buffer from the filtered dataset.
 */
export async function generateExcelWorkbook(payload: ExportDataPayload): Promise<Buffer> {
  const { habits, records, entries } = filterExportData(payload);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Personal Daily Routine Tracker";
  workbook.created = new Date();

  // Create lookups
  const habitMap = new Map(habits.map((h) => [h.id, h]));
  const recordMap = new Map(records.map((r) => [r.id, r]));

  // Group entries by daily_record_id -> habit_id -> entry
  const entryMatrix = new Map<string, Map<string, HabitEntry>>();
  for (const entry of entries) {
    if (!entryMatrix.has(entry.daily_record_id)) {
      entryMatrix.set(entry.daily_record_id, new Map());
    }
    entryMatrix.get(entry.daily_record_id)!.set(entry.habit_id, entry);
  }

  // --- SHEET 1: Daily Records (Matrix View) ---
  const dailySheet = workbook.addWorksheet("Daily Records", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 2 }],
  });

  const matrixColumns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Day Notes", key: "notes", width: 25 },
    ...habits.map((h) => ({
      header: h.name,
      key: `habit_${h.id}`,
      width: Math.max(16, h.name.length + 4),
    })),
  ];
  dailySheet.columns = matrixColumns;

  // Style Header
  dailySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  dailySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3F6B52" }, // Forest green
  };

  // Populate Matrix Rows
  for (const record of records) {
    const rowValues: Record<string, any> = {
      date: record.date,
      notes: record.notes || "",
    };

    const recordEntries = entryMatrix.get(record.id);

    for (const habit of habits) {
      const isApplicable = isHabitApplicableOnDate(habit, record.date);
      if (!isApplicable) {
        rowValues[`habit_${habit.id}`] = "N/A";
        continue;
      }

      const entry = recordEntries?.get(habit.id);
      if (!entry) {
        rowValues[`habit_${habit.id}`] = "-";
        continue;
      }

      // Format value safely
      rowValues[`habit_${habit.id}`] = formatEntryValueForDisplay(habit, entry);
    }

    dailySheet.addRow(rowValues);
  }

  // --- SHEET 2: Habit Entries (Normalized View) ---
  const entriesSheet = workbook.addWorksheet("Habit Entries", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  entriesSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Habit Name", key: "habit_name", width: 24 },
    { header: "Category", key: "category", width: 18 },
    { header: "Field Type", key: "field_type", width: 14 },
    { header: "Recorded Value", key: "value", width: 30 },
    { header: "Completed", key: "completed", width: 14 },
    { header: "Entry Notes", key: "notes", width: 25 },
  ];

  entriesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  entriesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3F6B52" },
  };

  for (const entry of entries) {
    const record = recordMap.get(entry.daily_record_id);
    const habit = habitMap.get(entry.habit_id);
    if (!record || !habit) continue;

    entriesSheet.addRow({
      date: record.date,
      habit_name: habit.name,
      category: habit.category,
      field_type: habit.field_type,
      value: formatEntryValueForDisplay(habit, entry),
      completed: entry.is_completed ? "Yes" : "No",
      notes: entry.notes || "",
    });
  }

  // --- SHEET 3: Habit Definitions ---
  const habitsSheet = workbook.addWorksheet("Habit Definitions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  habitsSheet.columns = [
    { header: "Habit Name", key: "name", width: 24 },
    { header: "Category", key: "category", width: 18 },
    { header: "Field Type", key: "field_type", width: 14 },
    { header: "Target Value", key: "target", width: 18 },
    { header: "Completion Metric", key: "metric", width: 16 },
    { header: "Required", key: "required", width: 12 },
    { header: "Activation Date", key: "activation", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Description", key: "description", width: 35 },
  ];

  habitsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  habitsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3F6B52" },
  };

  for (const habit of habits) {
    habitsSheet.addRow({
      name: habit.name,
      category: habit.category,
      field_type: habit.field_type,
      target: JSON.stringify(habit.target_value || ""),
      metric: habit.is_completion_metric ? "Yes" : "No",
      required: habit.is_required ? "Yes" : "No",
      activation: habit.activation_date,
      status: habit.archived_at ? "Archived" : "Active",
      description: habit.description || "",
    });
  }

  // --- SHEET 4: Summary ---
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 25 },
  ];

  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3F6B52" },
  };

  const totalCompletedEntries = entries.filter((e) => e.is_completed).length;
  const completionRate =
    entries.length > 0 ? Math.round((totalCompletedEntries / entries.length) * 100) : 0;

  summarySheet.addRow({ metric: "Export Date", value: new Date().toISOString() });
  summarySheet.addRow({
    metric: "Date Range",
    value: `${payload.filterOptions.startDate || "Start"} to ${payload.filterOptions.endDate || "Present"}`,
  });
  summarySheet.addRow({ metric: "Total Days Included", value: records.length });
  summarySheet.addRow({ metric: "Total Habits Included", value: habits.length });
  summarySheet.addRow({ metric: "Total Recorded Entries", value: entries.length });
  summarySheet.addRow({ metric: "Total Completed Entries", value: totalCompletedEntries });
  summarySheet.addRow({ metric: "Overall Entry Completion Rate", value: `${completionRate}%` });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Formats entry value into readable text representation.
 * Sanitizes formulas to prevent spreadsheet command injection.
 */
function formatEntryValueForDisplay(habit: Habit, entry: HabitEntry): string {
  const val = entry.value;
  if (val === null || val === undefined) return "";

  let result = "";
  if (habit.field_type === "checkbox") {
    const isCompleted = typeof val === "boolean" ? val : Boolean(val?.completed);
    result = isCompleted ? "Completed" : "Incomplete";
  } else if (habit.field_type === "time") {
    result = typeof val === "object" ? val.time || "" : String(val);
  } else if (habit.field_type === "duration") {
    const dur = typeof val === "object" ? val.duration : val;
    result = dur ? `${dur} mins` : "";
  } else if (habit.field_type === "url") {
    const url = typeof val === "object" ? val.url || "" : String(val);
    const title = typeof val === "object" ? val.title : "";
    result = title ? `${title} (${url})` : url;
  } else if (typeof val === "object") {
    result = val.text || val.selected || val.number !== undefined ? String(val.number) : JSON.stringify(val);
  } else {
    result = String(val);
  }

  // Prevent spreadsheet formula injection (=, +, -, @)
  if (result.startsWith("=") || result.startsWith("+") || result.startsWith("-") || result.startsWith("@")) {
    result = `'${result}`;
  }

  return result;
}

/**
 * Generates structured JSON export according to section 13 schema.
 */
export function generateJsonExport(payload: ExportDataPayload) {
  const { habits, records, entries } = filterExportData(payload);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    timezone: payload.timezone || DEFAULT_TIMEZONE,
    filters: payload.filterOptions,
    metadata: {
      totalRecords: records.length,
      totalHabits: habits.length,
      totalEntries: entries.length,
    },
    habits,
    records,
    entries,
  };
}
