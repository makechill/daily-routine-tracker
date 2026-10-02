import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const HabitUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  field_type: z.enum([
    "checkbox",
    "time",
    "text",
    "number",
    "duration",
    "url",
    "select",
    "date",
  ]).optional(),
  config: z.record(z.string(), z.any()).optional(),
  target_value: z.any().optional(),
  is_completion_metric: z.boolean().optional(),
  is_required: z.boolean().optional(),
  applicable_days: z.array(z.number()).optional(),
  activation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  archived_at: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
});

export async function PATCH(
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

  const habitId = params.id;

  try {
    const body = await request.json();
    const parseResult = HabitUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updates = {
      ...parseResult.data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedHabit, error: updateError } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", habitId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ habit: updatedHabit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update habit" }, { status: 500 });
  }
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

  const habitId = params.id;

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
