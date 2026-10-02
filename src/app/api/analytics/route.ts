import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Habit, DailyRecord, HabitEntry } from "@/types/routine";
import {
  getTodayDateString,
  addDays,
  getDateRangeArray,
  DEFAULT_TIMEZONE,
  isDateInFuture,
} from "@/lib/date-utils";
import {
  isHabitApplicableOnDate,
  calculateDayCompletion,
  calculateHabitStreaks,
} from "@/lib/habit-logic";

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
  const timeZone = searchParams.get("timezone") || DEFAULT_TIMEZONE;
  const today = getTodayDateString(timeZone);

  // 1. Fetch user's habits
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (habitsError) {
    return NextResponse.json({ error: habitsError.message }, { status: 500 });
  }

  const allHabits: Habit[] = habits || [];

  // 2. Fetch records and entries for the past 90 days to compute daily, weekly, monthly & streaks
  const past90DaysStart = addDays(today, -89);

  const { data: records } = await supabase
    .from("daily_records")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", past90DaysStart)
    .lte("date", today)
    .order("date", { ascending: true });

  const recordMap = new Map<string, DailyRecord>();
  const recordIds: string[] = [];
  for (const r of records || []) {
    recordMap.set(r.date, r);
    recordIds.push(r.id);
  }

  // 3. Fetch entries
  let entriesByRecordAndHabit = new Map<string, Map<string, HabitEntry>>();
  let entriesByHabitAndDate = new Map<string, Map<string, HabitEntry>>();

  if (recordIds.length > 0) {
    const { data: entries } = await supabase
      .from("habit_entries")
      .select("*")
      .in("daily_record_id", recordIds);

    if (entries) {
      for (const e of entries) {
        if (!entriesByRecordAndHabit.has(e.daily_record_id)) {
          entriesByRecordAndHabit.set(e.daily_record_id, new Map());
        }
        entriesByRecordAndHabit.get(e.daily_record_id)!.set(e.habit_id, e);
      }
    }
  }

  // Map entries by habit_id -> date -> entry
  recordMap.forEach((record, date) => {
    const recEntries = entriesByRecordAndHabit.get(record.id);
    if (recEntries) {
      recEntries.forEach((entry, habitId) => {
        if (!entriesByHabitAndDate.has(habitId)) {
          entriesByHabitAndDate.set(habitId, new Map());
        }
        entriesByHabitAndDate.get(habitId)!.set(date, entry);
      });
    }
  });

  // 4. Compute Daily Analytics (Today)
  const todayRecord = recordMap.get(today);
  const todayEntries: Record<string, HabitEntry> = {};
  if (todayRecord) {
    const recEntries = entriesByRecordAndHabit.get(todayRecord.id);
    if (recEntries) {
      for (const [hId, entry] of recEntries.entries()) {
        todayEntries[hId] = entry;
      }
    }
  }

  const todayStats = calculateDayCompletion(allHabits, todayEntries, today, timeZone);

  // Target vs Actual times for today
  let wakeUpComparison: { target: string | null; actual: string | null } | null = null;
  let sleepTimeComparison: { target: string | null; actual: string | null } | null = null;

  const wakeHabit = allHabits.find((h) => h.name.toLowerCase().includes("wake"));
  if (wakeHabit) {
    const entry = todayEntries[wakeHabit.id];
    wakeUpComparison = {
      target: wakeHabit.target_value || "07:00",
      actual: entry?.value?.time || (typeof entry?.value === "string" ? entry.value : null),
    };
  }

  const sleepHabit = allHabits.find((h) => h.name.toLowerCase().includes("sleep"));
  if (sleepHabit) {
    const entry = todayEntries[sleepHabit.id];
    sleepTimeComparison = {
      target: sleepHabit.target_value || "23:00",
      actual: entry?.value?.time || (typeof entry?.value === "string" ? entry.value : null),
    };
  }

  // 5. Compute Weekly Analytics (Past 7 days)
  const past7Days = getDateRangeArray(addDays(today, -6), today);
  const weeklyTrends = past7Days.map((date) => {
    const record = recordMap.get(date);
    const entries: Record<string, HabitEntry> = {};
    if (record) {
      const recEntries = entriesByRecordAndHabit.get(record.id);
      if (recEntries) {
        for (const [hId, entry] of recEntries.entries()) {
          entries[hId] = entry;
        }
      }
    }
    return calculateDayCompletion(allHabits, entries, date, timeZone);
  });

  // Calculate weekly specific metrics
  let totalWeeklyWorkoutMinutes = 0;
  let totalWeeklyLearningMinutes = 0;
  let weeklyWalkingCompletedCount = 0;
  let weeklyYouTubeUploadsCount = 0;

  for (const date of past7Days) {
    const record = recordMap.get(date);
    if (!record) continue;
    const recEntries = entriesByRecordAndHabit.get(record.id);
    if (!recEntries) continue;

    for (const habit of allHabits) {
      const entry = recEntries.get(habit.id);
      if (!entry || !entry.is_completed) continue;

      const lowerName = habit.name.toLowerCase();
      if (lowerName.includes("workout")) {
        const dur = typeof entry.value === "object" ? entry.value.duration : Number(entry.value);
        if (dur) totalWeeklyWorkoutMinutes += dur;
      }
      if (lowerName.includes("learning")) {
        const dur = typeof entry.value === "object" ? entry.value.duration : Number(entry.value);
        if (dur) totalWeeklyLearningMinutes += dur;
      }
      if (lowerName.includes("walk")) {
        weeklyWalkingCompletedCount++;
      }
      if (lowerName.includes("youtube")) {
        weeklyYouTubeUploadsCount++;
      }
    }
  }

  // 6. Compute Monthly Analytics (Past 30 days)
  const past30Days = getDateRangeArray(addDays(today, -29), today);
  let totalMonthlyApplicable = 0;
  let totalMonthlyCompleted = 0;

  const monthlyDayStats = past30Days.map((date) => {
    const record = recordMap.get(date);
    const entries: Record<string, HabitEntry> = {};
    if (record) {
      const recEntries = entriesByRecordAndHabit.get(record.id);
      if (recEntries) {
        for (const [hId, entry] of recEntries.entries()) {
          entries[hId] = entry;
        }
      }
    }
    const dayStat = calculateDayCompletion(allHabits, entries, date, timeZone);
    totalMonthlyApplicable += dayStat.applicableHabitsCount;
    totalMonthlyCompleted += dayStat.completedHabitsCount;
    return dayStat;
  });

  const monthlyCompletionRate =
    totalMonthlyApplicable > 0 ? Math.round((totalMonthlyCompleted / totalMonthlyApplicable) * 100) : 0;

  // 7. Calculate Per-Habit Streaks & Overall Streaks
  const habitStreaks = allHabits.map((habit) => {
    const dateMap = entriesByHabitAndDate.get(habit.id) || new Map();
    return calculateHabitStreaks(habit, dateMap, timeZone);
  });

  // Calculate overall day streak (days with 100% completion)
  let currentOverallStreak = 0;
  let longestOverallStreak = 0;
  let runningOverallStreak = 0;
  let checkingCurrentStreak = true;

  // Check today first
  if (todayStats.applicableHabitsCount > 0 && todayStats.percentage === 100) {
    currentOverallStreak++;
  }

  // Check previous days backwards
  for (let i = 1; i <= 90; i++) {
    const pastDate = addDays(today, -i);
    const record = recordMap.get(pastDate);
    const entries: Record<string, HabitEntry> = {};
    if (record) {
      const recEntries = entriesByRecordAndHabit.get(record.id);
      if (recEntries) {
        for (const [hId, entry] of recEntries.entries()) {
          entries[hId] = entry;
        }
      }
    }

    const dayStat = calculateDayCompletion(allHabits, entries, pastDate, timeZone);
    // If no applicable habits on that day, it doesn't break streak
    if (dayStat.applicableHabitsCount === 0) continue;

    if (dayStat.percentage === 100) {
      if (checkingCurrentStreak) {
        currentOverallStreak++;
      }
      runningOverallStreak++;
      if (runningOverallStreak > longestOverallStreak) {
        longestOverallStreak = runningOverallStreak;
      }
    } else {
      checkingCurrentStreak = false;
      runningOverallStreak = 0;
    }
  }

  if (currentOverallStreak > longestOverallStreak) {
    longestOverallStreak = currentOverallStreak;
  }

  // Most consistent & frequently incomplete habits
  const sortedByConsistency = [...habitStreaks].sort((a, b) => b.completionRate - a.completionRate);
  const mostConsistentHabits = sortedByConsistency.slice(0, 3);
  const leastConsistentHabits = [...sortedByConsistency].reverse().slice(0, 3);

  return NextResponse.json({
    today: todayStats,
    wakeUpComparison,
    sleepTimeComparison,
    weekly: {
      days: weeklyTrends,
      totalWorkoutMinutes: totalWeeklyWorkoutMinutes,
      totalLearningMinutes: totalWeeklyLearningMinutes,
      walkingCompletedCount: weeklyWalkingCompletedCount,
      youTubeUploadsCount: weeklyYouTubeUploadsCount,
    },
    monthly: {
      days: monthlyDayStats,
      completionRate: monthlyCompletionRate,
      totalCompletedActivities: totalMonthlyCompleted,
    },
    streaks: {
      currentOverallStreak,
      longestOverallStreak,
      habitStreaks,
    },
    insights: {
      mostConsistentHabits,
      leastConsistentHabits,
    },
  });
}
