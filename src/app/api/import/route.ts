import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validateAndPreviewImport, ValidatedJsonImport } from "@/lib/import-engine";
import { determineEntryCompletion } from "@/lib/habit-logic";
import { Habit } from "@/types/routine";

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
    const { action, payload, mode, validatedData } = body;

    // 1. Fetch existing user habits & dates to detect conflicts
    const { data: existingHabits } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id);

    const { data: existingRecords } = await supabase
      .from("daily_records")
      .select("date")
      .eq("user_id", user.id);

    const existingHabitIds = new Set((existingHabits || []).map((h) => h.id));
    const existingDates = new Set((existingRecords || []).map((r) => r.date));

    // ACTION: PREVIEW
    if (action === "preview") {
      const preview = validateAndPreviewImport(payload, existingHabitIds, existingDates);
      return NextResponse.json(preview);
    }

    // ACTION: EXECUTE
    if (action === "execute") {
      if (!validatedData) {
        return NextResponse.json({ error: "Missing validated import data" }, { status: 400 });
      }

      const importData = validatedData as ValidatedJsonImport;
      const importMode = mode === "replace" ? "replace" : "merge";

      // 1. Process Habits
      const habitIdMap = new Map<string, string>(); // oldId -> newId or existingId
      const habitDefsMap = new Map<string, any>();

      for (const h of importData.habits) {
        // Upsert habit
        const { data: savedHabit, error: habitError } = await supabase
          .from("habits")
          .upsert({
            user_id: user.id,
            name: h.name,
            description: h.description || null,
            category: h.category,
            field_type: h.field_type,
            config: h.config || {},
            target_value: h.target_value ?? null,
            is_completion_metric: h.is_completion_metric ?? true,
            is_required: h.is_required ?? false,
            applicable_days: h.applicable_days || [0, 1, 2, 3, 4, 5, 6],
            activation_date: h.activation_date || new Date().toISOString().slice(0, 10),
            archived_at: h.archived_at || null,
            display_order: h.display_order ?? 0,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (savedHabit) {
          habitIdMap.set(h.id, savedHabit.id);
          habitDefsMap.set(savedHabit.id, savedHabit);
        }
      }

      // If replace mode, delete records within the imported date range
      if (importMode === "replace") {
        const dates = importData.records.map((r) => r.date);
        if (dates.length > 0) {
          await supabase
            .from("daily_records")
            .delete()
            .eq("user_id", user.id)
            .in("date", dates);
        }
      }

      // 2. Process Records
      let importedRecordsCount = 0;
      let importedEntriesCount = 0;

      // Map imported entries by date or by daily_record_id
      const recordIdToDateMap = new Map<string, string>();
      for (const r of importData.records) {
        if (r.id) {
          recordIdToDateMap.set(r.id, r.date);
        }
      }

      for (const rec of importData.records) {
        const { data: savedRecord, error: recError } = await supabase
          .from("daily_records")
          .upsert(
            {
              user_id: user.id,
              date: rec.date,
              notes: rec.notes || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,date" }
          )
          .select()
          .single();

        if (recError || !savedRecord) continue;
        importedRecordsCount++;

        // Find entries belonging to this record
        const matchingEntries = importData.entries.filter((e) => {
          if (e.date && e.date === rec.date) return true;
          if (e.daily_record_id && recordIdToDateMap.get(e.daily_record_id) === rec.date)
            return true;
          return false;
        });

        if (matchingEntries.length > 0) {
          const entryRows = matchingEntries.map((e) => {
            const mappedHabitId = habitIdMap.get(e.habit_id) || e.habit_id;
            const habitDef = habitDefsMap.get(mappedHabitId);
            const isCompleted = habitDef
              ? determineEntryCompletion(habitDef as Habit, e.value)
              : Boolean(e.is_completed);

            return {
              daily_record_id: savedRecord.id,
              habit_id: mappedHabitId,
              user_id: user.id,
              value: e.value,
              notes: e.notes || null,
              is_completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            };
          });

          const { data: savedEntries } = await supabase
            .from("habit_entries")
            .upsert(entryRows, { onConflict: "daily_record_id,habit_id" })
            .select();

          if (savedEntries) {
            importedEntriesCount += savedEntries.length;
          }
        }
      }

      return NextResponse.json({
        success: true,
        mode: importMode,
        importedHabitsCount: habitIdMap.size,
        importedRecordsCount,
        importedEntriesCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process import" }, { status: 500 });
  }
}
