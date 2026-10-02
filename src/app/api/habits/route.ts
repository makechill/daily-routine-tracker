import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const HabitCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  category: z.string().default("General"),
  field_type: z.enum([
    "checkbox",
    "time",
    "text",
    "number",
    "duration",
    "url",
    "select",
    "date",
  ]),
  config: z.record(z.string(), z.any()).default({}),
  target_value: z.any().optional(),
  is_completion_metric: z.boolean().default(true),
  is_required: z.boolean().default(false),
  applicable_days: z.array(z.number()).default([0, 1, 2, 3, 4, 5, 6]),
  activation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  display_order: z.number().int().optional(),
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

  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ habits: habits || [] });
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
    const parseResult = HabitCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Get max display order
    const { data: currentHabits } = await supabase
      .from("habits")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = input.display_order ?? (currentHabits?.[0]?.display_order ? currentHabits[0].display_order + 1 : 1);

    const { data: newHabit, error: insertError } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description || null,
        category: input.category || "General",
        field_type: input.field_type,
        config: input.config || {},
        target_value: input.target_value ?? null,
        is_completion_metric: input.is_completion_metric,
        is_required: input.is_required,
        applicable_days: input.applicable_days,
        activation_date: input.activation_date || new Date().toISOString().slice(0, 10),
        display_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ habit: newHabit }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create habit" }, { status: 500 });
  }
}
