import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateJsonExport } from "@/lib/export-engine";
import { ExportFilterOptions } from "@/types/routine";

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
    const filterOptions: ExportFilterOptions = body.filterOptions || {
      dateRangePreset: "all",
      habitIds: [],
      includeArchived: true,
      statusFilter: "all",
    };

    // 1. Fetch habits
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    // 2. Fetch records
    let recordsQuery = supabase
      .from("daily_records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (filterOptions.startDate) {
      recordsQuery = recordsQuery.gte("date", filterOptions.startDate);
    }
    if (filterOptions.endDate) {
      recordsQuery = recordsQuery.lte("date", filterOptions.endDate);
    }

    const { data: records } = await recordsQuery;

    // 3. Fetch entries
    const recordIds = (records || []).map((r) => r.id);
    let entries: any[] = [];
    if (recordIds.length > 0) {
      const { data: fetchedEntries } = await supabase
        .from("habit_entries")
        .select("*")
        .in("daily_record_id", recordIds);
      entries = fetchedEntries || [];
    }

    // 4. Generate JSON export
    const jsonExport = generateJsonExport({
      habits: habits || [],
      records: records || [],
      entries,
      filterOptions,
    });

    return NextResponse.json(jsonExport);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate JSON export" }, { status: 500 });
  }
}
