import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  time_format: z.enum(["12h", "24h"]).optional(),
  week_starts_on: z.number().int().min(0).max(6).optional(),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: profile, error } = await supabase
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

  return NextResponse.json({ profile, userEmail: user.email });
}

export async function PATCH(request: Request) {
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
    const parseResult = ProfileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.format() }, { status: 400 });
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...parseResult.data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
