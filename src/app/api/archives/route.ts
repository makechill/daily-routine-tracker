import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { generateJsonExport } from "@/lib/export-engine";
import { ExportFilterOptions } from "@/types/routine";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: archives, error } = await supabase
    .from("archive_snapshots")
    .select("id, archive_name, date_range_start, date_range_end, export_format, record_count, entry_count, habit_count, status, checksum, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ archives: archives || [] });
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
    const archiveName = body.name || `Snapshot - ${new Date().toISOString().slice(0, 10)}`;

    // 1. Fetch all user data
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    const { data: records } = await supabase
      .from("daily_records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    const recordIds = (records || []).map((r) => r.id);
    let entries: any[] = [];
    if (recordIds.length > 0) {
      const { data: fetchedEntries } = await supabase
        .from("habit_entries")
        .select("*")
        .in("daily_record_id", recordIds);
      entries = fetchedEntries || [];
    }

    const filterOptions: ExportFilterOptions = {
      dateRangePreset: "all",
      habitIds: [],
      includeArchived: true,
      statusFilter: "all",
    };

    // 2. Generate snapshot payload
    const payload = generateJsonExport({
      habits: habits || [],
      records: records || [],
      entries,
      filterOptions,
    });

    const payloadString = JSON.stringify(payload);
    const checksum = crypto.createHash("sha256").update(payloadString).digest("hex");

    const dates = (records || []).map((r) => r.date);
    const startDate = dates[0] || new Date().toISOString().slice(0, 10);
    const endDate = dates[dates.length - 1] || startDate;

    // 3. Save to archive_snapshots table
    const { data: snapshot, error: insertError } = await supabase
      .from("archive_snapshots")
      .insert({
        user_id: user.id,
        archive_name: archiveName,
        date_range_start: startDate,
        date_range_end: endDate,
        export_format: "json",
        record_count: (records || []).length,
        entry_count: entries.length,
        habit_count: (habits || []).length,
        status: "verified",
        checksum,
        payload,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        archive_name: snapshot.archive_name,
        date_range_start: snapshot.date_range_start,
        date_range_end: snapshot.date_range_end,
        record_count: snapshot.record_count,
        entry_count: snapshot.entry_count,
        habit_count: snapshot.habit_count,
        checksum: snapshot.checksum,
        status: snapshot.status,
        created_at: snapshot.created_at,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create archive" }, { status: 500 });
  }
}
