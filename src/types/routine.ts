export type FieldType =
  | "checkbox"
  | "time"
  | "text"
  | "number"
  | "duration"
  | "url"
  | "select"
  | "date";

export interface HabitConfig {
  placeholder?: string;
  allow_notes?: boolean;
  notes_placeholder?: string;
  has_duration?: boolean;
  default_duration?: number;
  duration_unit?: "minutes" | "hours";
  options?: string[]; // for select
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  require_url?: boolean;
  allow_title?: boolean;
  completion_rule?: "non_empty" | "checked" | "time_entered" | "min_value";
  min_completion_value?: number;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  category: string;
  field_type: FieldType;
  config: HabitConfig;
  target_value?: any;
  is_completion_metric: boolean;
  is_required: boolean;
  applicable_days: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  activation_date: string; // YYYY-MM-DD
  archived_at?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DailyRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitEntryValue {
  // Supports polymorphic values per field_type
  completed?: boolean;
  time?: string; // HH:mm
  text?: string;
  number?: number;
  duration?: number; // in minutes
  url?: string;
  title?: string;
  selected?: string;
  date?: string;
  raw?: any;
}

export interface HabitEntry {
  id: string;
  daily_record_id: string;
  habit_id: string;
  user_id: string;
  value: HabitEntryValue | any;
  notes?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  timezone: string;
  date_format: string;
  time_format: "12h" | "24h";
  week_starts_on: number; // 1 = Mon, 0 = Sun
  created_at: string;
  updated_at: string;
}

export interface ArchiveSnapshot {
  id: string;
  user_id: string;
  archive_name: string;
  date_range_start: string;
  date_range_end: string;
  export_format: "json" | "xlsx";
  record_count: number;
  entry_count: number;
  habit_count: number;
  status: "verified" | "failed" | "pending";
  checksum: string;
  payload: any;
  created_at: string;
}

export interface RoutineDayData {
  record: DailyRecord | null;
  date: string;
  entries: Record<string, HabitEntry>; // keyed by habit_id
}

export interface DayCompletionStats {
  date: string;
  applicableHabitsCount: number;
  completedHabitsCount: number;
  percentage: number;
  isFuture: boolean;
}

export interface HabitStreakStats {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0 - 100
}

export interface ExportFilterOptions {
  dateRangePreset: "today" | "week" | "month" | "all" | "custom";
  startDate?: string;
  endDate?: string;
  habitIds: string[]; // empty means all
  includeArchived: boolean;
  statusFilter: "all" | "completed_only" | "incomplete_only";
  category?: string;
  searchTerm?: string;
}
