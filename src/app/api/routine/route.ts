import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { INITIAL_DEFAULT_HABITS } from "@/lib/default-habits";
import { determineEntryCompletion } from "@/lib/habit-logic";
import { Habit } from "@/types/routine";
import { addDays, getTodayDateString } from "@/lib/date-utils";

const SaveRoutineSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().nullable().optional(),
  entries: z.array(
    z.object({
      habit_id: z.string().uuid(),
      value: z.any(),
      notes: z.string().nullable().optional(),
    })
  ),
});

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getTodayDateString();

  // 1. Fetch or create profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ id: user.id, timezone: "Asia/Kolkata" })
      .select()
      .single();
    profile = newProfile;
  }

  // 2. Fetch habits
  let { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (habitsError) {
    return NextResponse.json({ error: habitsError.message }, { status: 500 });
  }

  // If user has 0 habits, automatically seed the 11 initial habits!
  if (!habits || habits.length === 0) {
    const defaultRows = INITIAL_DEFAULT_HABITS.map((h) => ({
      user_id: user.id,
      name: h.name,
      description: h.description,
      category: h.category,
      field_type: h.field_type,
      config: h.config,
      target_value: h.target_value,
      is_completion_metric: h.is_completion_metric,
      is_required: h.is_required,
      applicable_days: h.applicable_days,
      display_order: h.display_order,
      activation_date: date,
    }));

    const { data: seededHabits, error: seedError } = await supabase
      .from("habits")
      .insert(defaultRows)
      .select();

    if (!seedError && seededHabits) {
      habits = seededHabits;
    }
  }

  // 3. Fetch daily record for this date
  const { data: record } = await supabase
    .from("daily_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  // 4. Fetch entries if record exists
  let entriesMap: Record<string, any> = {};
  if (record) {
    const { data: entries } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("daily_record_id", record.id);

    if (entries) {
      for (const entry of entries) {
        entriesMap[entry.habit_id] = entry;
      }
    }
  }

  // 5. Fetch yesterday's entries for quick "Copy from yesterday" feature
  const yesterdayDate = addDays(date, -1);
  const { data: yesterdayRecord } = await supabase
    .from("daily_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", yesterdayDate)
    .maybeSingle();

  const yesterdayEntriesMap: Record<string, any> = {};
  if (yesterdayRecord) {
    const { data: yEntries } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("daily_record_id", yesterdayRecord.id);

    if (yEntries) {
      for (const entry of yEntries) {
        yesterdayEntriesMap[entry.habit_id] = entry;
      }
    }
  }

  return NextResponse.json({
    date,
    profile,
    habits: habits || [],
    record: record || null,
    entries: entriesMap,
    yesterdayEntries: yesterdayEntriesMap,
  });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parseResult = SaveRoutineSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { date, notes, entries } = parseResult.data;

    // 1. Fetch all user habits to evaluate completion correctly
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id);

    const habitMap = new Map<string, Habit>();
    if (habits) {
      for (const h of habits) {
        habitMap.set(h.id, h);
      }
    }

    // 2. Upsert daily record
    const { data: dailyRecord, error: recordError } = await supabase
      .from("daily_records")
      .upsert(
        {
          user_id: user.id,
          date,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (recordError || !dailyRecord) {
      return NextResponse.json({ error: recordError?.message || "Failed to save daily record" }, { status: 500 });
    }

    // 3. Upsert entries
    const savedEntriesMap: Record<string, any> = {};

    if (entries.length > 0) {
      const entryRows = entries.map((e) => {
        const habit = habitMap.get(e.habit_id);
        const isCompleted = habit ? determineEntryCompletion(habit, e.value) : false;

        return {
          daily_record_id: dailyRecord.id,
          habit_id: e.habit_id,
          user_id: user.id,
          value: e.value ?? null,
          notes: e.notes || null,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      });

      const { data: upsertedEntries, error: entriesError } = await supabase
        .from("habit_entries")
        .upsert(entryRows, { onConflict: "daily_record_id,habit_id" })
        .select();

      if (entriesError) {
        return NextResponse.json({ error: entriesError.message }, { status: 500 });
      }

      if (upsertedEntries) {
        for (const entry of upsertedEntries) {
          savedEntriesMap[entry.habit_id] = entry;
        }
      }
    }

    return NextResponse.json({
      success: true,
      record: dailyRecord,
      entries: savedEntriesMap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
