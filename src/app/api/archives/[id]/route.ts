import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archiveId = params.id;

  const { data: archive, error } = await supabase
    .from("archive_snapshots")
    .select("*")
    .eq("id", archiveId)
    .eq("user_id", user.id)
    .single();

  if (error || !archive) {
    return NextResponse.json({ error: "Archive not found" }, { status: 404 });
  }

  // Verify integrity
  const payloadString = JSON.stringify(archive.payload);
  const calculatedChecksum = crypto.createHash("sha256").update(payloadString).digest("hex");
  const isVerified = calculatedChecksum === archive.checksum;

  return NextResponse.json({
    archive: {
      ...archive,
      verified: isVerified,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archiveId = params.id;

  const { error } = await supabase
    .from("archive_snapshots")
    .delete()
    .eq("id", archiveId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
