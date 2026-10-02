import { FieldType, HabitConfig } from "@/types/routine";

export interface DefaultHabitDef {
  name: string;
  description: string;
  category: string;
  field_type: FieldType;
  config: HabitConfig;
  target_value: any;
  is_completion_metric: boolean;
  is_required: boolean;
  applicable_days: number[];
  display_order: number;
}

export const INITIAL_DEFAULT_HABITS: DefaultHabitDef[] = [
  {
    name: "Wake-up time",
    description: "Target wake-up time vs actual wake-up time",
    category: "Morning Routine",
    field_type: "time",
    config: {
      placeholder: "HH:MM",
      completion_rule: "time_entered",
    },
    target_value: "07:00",
    is_completion_metric: true,
    is_required: true,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 1,
  },
  {
    name: "Daily detox drink",
    description: "Warm lemon water, herbal infusion, or greens",
    category: "Nutrition",
    field_type: "checkbox",
    config: {
      allow_notes: true,
      notes_placeholder: "Drink ingredients / notes",
    },
    target_value: true,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 2,
  },
  {
    name: "Workout",
    description: "Physical exercise, gym, or home routine",
    category: "Health & Fitness",
    field_type: "checkbox",
    config: {
      has_duration: true,
      duration_unit: "minutes",
      allow_notes: true,
      notes_placeholder: "Workout type, intensity, sets",
    },
    target_value: { completed: true, duration: 45 },
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 3,
  },
  {
    name: "Breakfast",
    description: "Nutritious morning meal",
    category: "Nutrition",
    field_type: "text",
    config: {
      placeholder: "What did you have for breakfast?",
      completion_rule: "non_empty",
    },
    target_value: null,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 4,
  },
  {
    name: "Lunch",
    description: "Midday balanced meal",
    category: "Nutrition",
    field_type: "text",
    config: {
      placeholder: "What did you have for lunch?",
      completion_rule: "non_empty",
    },
    target_value: null,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 5,
  },
  {
    name: "Fifteen-minute walk after lunch",
    description: "Post-lunch digestion stroll",
    category: "Health & Fitness",
    field_type: "checkbox",
    config: {
      has_duration: true,
      default_duration: 15,
      duration_unit: "minutes",
    },
    target_value: { completed: true, duration: 15 },
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 6,
  },
  {
    name: "Daily YouTube video upload",
    description: "Publish routine content or educational video",
    category: "Productivity",
    field_type: "url",
    config: {
      require_url: false,
      allow_title: true,
      placeholder: "https://youtube.com/watch?v=...",
    },
    target_value: null,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 7,
  },
  {
    name: "Learning something new",
    description: "Reading, course study, skill practice",
    category: "Learning",
    field_type: "text",
    config: {
      placeholder: "What did you learn today?",
      has_duration: true,
      duration_unit: "minutes",
      completion_rule: "non_empty",
    },
    target_value: null,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 8,
  },
  {
    name: "Dinner",
    description: "Evening nourishing meal",
    category: "Nutrition",
    field_type: "text",
    config: {
      placeholder: "What did you have for dinner?",
      completion_rule: "non_empty",
    },
    target_value: null,
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 9,
  },
  {
    name: "Fifteen-minute walk after dinner",
    description: "Post-dinner relaxation walk",
    category: "Health & Fitness",
    field_type: "checkbox",
    config: {
      has_duration: true,
      default_duration: 15,
      duration_unit: "minutes",
    },
    target_value: { completed: true, duration: 15 },
    is_completion_metric: true,
    is_required: false,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 10,
  },
  {
    name: "Sleeping time",
    description: "Target bedtime vs actual sleeping time",
    category: "Evening Routine",
    field_type: "time",
    config: {
      placeholder: "HH:MM",
      completion_rule: "time_entered",
    },
    target_value: "23:00",
    is_completion_metric: true,
    is_required: true,
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    display_order: 11,
  },
];
