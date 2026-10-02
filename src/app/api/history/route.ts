import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPresetDateRange } from "@/lib/date-utils";

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
  const startDate = searchParams.get("start") || getPresetDateRange("past30").start;
  const endDate = searchParams.get("end") || getPresetDateRange("past30").end;
  const sort = searchParams.get("sort") === "asc" ? true : false; // default desc
  const search = searchParams.get("search")?.toLowerCase();

  // 1. Fetch habits
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (habitsError) {
    return NextResponse.json({ error: habitsError.message }, { status: 500 });
  }

  // 2. Fetch daily records within date range
  let query = supabase
    .from("daily_records")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: sort });

  const { data: records, error: recordsError } = await query;

  if (recordsError) {
    return NextResponse.json({ error: recordsError.message }, { status: 500 });
  }

  // 3. Fetch entries for all retrieved records
  const recordIds = (records || []).map((r) => r.id);
  let entriesMap: Record<string, Record<string, any>> = {};

  if (recordIds.length > 0) {
    const { data: entries } = await supabase
      .from("habit_entries")
      .select("*")
      .in("daily_record_id", recordIds);

    if (entries) {
      for (const entry of entries) {
        if (!entriesMap[entry.daily_record_id]) {
          entriesMap[entry.daily_record_id] = {};
        }
        entriesMap[entry.daily_record_id][entry.habit_id] = entry;
      }
    }
  }

  // 4. Filter by search if provided (checks day notes or entry texts/values)
  let filteredRecords = records || [];
  if (search) {
    filteredRecords = filteredRecords.filter((record) => {
      // Check notes
      if (record.notes && record.notes.toLowerCase().includes(search)) return true;
      // Check date
      if (record.date.includes(search)) return true;
      // Check entries for this record
      const recEntries = entriesMap[record.id];
      if (recEntries) {
        for (const habitId in recEntries) {
          const val = recEntries[habitId]?.value;
          const notes = recEntries[habitId]?.notes;
          if (notes && notes.toLowerCase().includes(search)) return true;
          if (typeof val === "string" && val.toLowerCase().includes(search)) return true;
          if (typeof val === "object" && JSON.stringify(val).toLowerCase().includes(search)) return true;
        }
      }
      return false;
    });
  }

  return NextResponse.json({
    habits: habits || [],
    records: filteredRecords,
    entries: entriesMap,
    dateRange: { start: startDate, end: endDate },
  });
}
