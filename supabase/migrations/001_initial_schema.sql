-- Migration 001: Initial Schema for Personal Daily Routine Tracker

-- 1. PROFILES / USER SETTINGS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    time_format TEXT NOT NULL DEFAULT '12h',
    week_starts_on INTEGER NOT NULL DEFAULT 1, -- 1: Monday, 0: Sunday
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. HABITS DEFINITION TABLE
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    field_type TEXT NOT NULL, -- 'checkbox', 'time', 'text', 'number', 'duration', 'url', 'select', 'date'
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_value JSONB,
    is_completion_metric BOOLEAN NOT NULL DEFAULT true,
    is_required BOOLEAN NOT NULL DEFAULT false,
    applicable_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sun, 1=Mon, ..., 6=Sat
    activation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    archived_at TIMESTAMPTZ,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. DAILY RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.daily_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT daily_records_user_date_unique UNIQUE (user_id, date)
);

-- 4. HABIT ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.habit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value JSONB NOT NULL DEFAULT 'null'::jsonb,
    notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT habit_entries_record_habit_unique UNIQUE (daily_record_id, habit_id)
);

-- 5. ARCHIVE SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS public.archive_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    archive_name TEXT NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    export_format TEXT NOT NULL DEFAULT 'json',
    record_count INTEGER NOT NULL DEFAULT 0,
    entry_count INTEGER NOT NULL DEFAULT 0,
    habit_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'verified',
    checksum TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_habits_user_order ON public.habits(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON public.habits(user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON public.daily_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_entries_record ON public.habit_entries(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_habit ON public.habit_entries(user_id, habit_id);
CREATE INDEX IF NOT EXISTS idx_archives_user_created ON public.archive_snapshots(user_id, created_at DESC);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_snapshots ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- HABITS POLICIES
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- DAILY RECORDS POLICIES
DROP POLICY IF EXISTS "Users can view own daily records" ON public.daily_records;
CREATE POLICY "Users can view own daily records" ON public.daily_records
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily records" ON public.daily_records;
CREATE POLICY "Users can insert own daily records" ON public.daily_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily records" ON public.daily_records;
CREATE POLICY "Users can update own daily records" ON public.daily_records
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily records" ON public.daily_records;
CREATE POLICY "Users can delete own daily records" ON public.daily_records
    FOR DELETE USING (auth.uid() = user_id);

-- HABIT ENTRIES POLICIES
DROP POLICY IF EXISTS "Users can view own habit entries" ON public.habit_entries;
CREATE POLICY "Users can view own habit entries" ON public.habit_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habit entries" ON public.habit_entries;
CREATE POLICY "Users can insert own habit entries" ON public.habit_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habit entries" ON public.habit_entries;
CREATE POLICY "Users can update own habit entries" ON public.habit_entries
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habit entries" ON public.habit_entries;
CREATE POLICY "Users can delete own habit entries" ON public.habit_entries
    FOR DELETE USING (auth.uid() = user_id);

-- ARCHIVE SNAPSHOTS POLICIES
DROP POLICY IF EXISTS "Users can view own archive snapshots" ON public.archive_snapshots;
CREATE POLICY "Users can view own archive snapshots" ON public.archive_snapshots
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own archive snapshots" ON public.archive_snapshots;
CREATE POLICY "Users can insert own archive snapshots" ON public.archive_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own archive snapshots" ON public.archive_snapshots;
CREATE POLICY "Users can delete own archive snapshots" ON public.archive_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- HELPER FUNCTION TO SEED DEFAULT HABITS
CREATE OR REPLACE FUNCTION public.seed_default_habits_for_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Check if user already has habits
    IF NOT EXISTS (SELECT 1 FROM public.habits WHERE user_id = target_user_id) THEN
        INSERT INTO public.habits (user_id, name, description, category, field_type, config, target_value, is_completion_metric, is_required, applicable_days, display_order)
        VALUES
        (
            target_user_id,
            'Wake-up time',
            'Target wake-up time vs actual wake-up time',
            'Morning Routine',
            'time',
            '{"placeholder": "HH:MM"}'::jsonb,
            '"07:00"'::jsonb,
            true,
            true,
            '{0,1,2,3,4,5,6}',
            1
        ),
        (
            target_user_id,
            'Daily detox drink',
            'Warm lemon water, herbal infusion, or greens',
            'Nutrition',
            'checkbox',
            '{"allow_notes": true, "notes_placeholder": "Drink ingredients / notes"}'::jsonb,
            'true'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            2
        ),
        (
            target_user_id,
            'Workout',
            'Physical exercise, gym, or home routine',
            'Health & Fitness',
            'checkbox',
            '{"has_duration": true, "duration_unit": "minutes", "allow_notes": true}'::jsonb,
            '{"completed": true, "duration": 45}'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            3
        ),
        (
            target_user_id,
            'Breakfast',
            'Nutritious morning meal',
            'Nutrition',
            'text',
            '{"placeholder": "What did you have for breakfast?", "completion_rule": "non_empty"}'::jsonb,
            'null'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            4
        ),
        (
            target_user_id,
            'Lunch',
            'Midday balanced meal',
            'Nutrition',
            'text',
            '{"placeholder": "What did you have for lunch?", "completion_rule": "non_empty"}'::jsonb,
            'null'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            5
        ),
        (
            target_user_id,
            'Fifteen-minute walk after lunch',
            'Post-lunch digestion stroll',
            'Health & Fitness',
            'checkbox',
            '{"has_duration": true, "default_duration": 15, "duration_unit": "minutes"}'::jsonb,
            '{"completed": true, "duration": 15}'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            6
        ),
        (
            target_user_id,
            'Daily YouTube video upload',
            'Publish routine content or educational video',
            'Productivity',
            'url',
            '{"require_url": false, "allow_title": true, "placeholder": "https://youtube.com/watch?v=..."}'::jsonb,
            'null'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            7
        ),
        (
            target_user_id,
            'Learning something new',
            'Reading, course study, skill practice',
            'Learning',
            'text',
            '{"placeholder": "What did you learn today?", "has_duration": true, "duration_unit": "minutes", "completion_rule": "non_empty"}'::jsonb,
            'null'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            8
        ),
        (
            target_user_id,
            'Dinner',
            'Evening nourishing meal',
            'Nutrition',
            'text',
            '{"placeholder": "What did you have for dinner?", "completion_rule": "non_empty"}'::jsonb,
            'null'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            9
        ),
        (
            target_user_id,
            'Fifteen-minute walk after dinner',
            'Post-dinner relaxation walk',
            'Health & Fitness',
            'checkbox',
            '{"has_duration": true, "default_duration": 15, "duration_unit": "minutes"}'::jsonb,
            '{"completed": true, "duration": 15}'::jsonb,
            true,
            false,
            '{0,1,2,3,4,5,6}',
            10
        ),
        (
            target_user_id,
            'Sleeping time',
            'Target bedtime vs actual sleeping time',
            'Evening Routine',
            'time',
            '{"placeholder": "HH:MM"}'::jsonb,
            '"23:00"'::jsonb,
            true,
            true,
            '{0,1,2,3,4,5,6}',
            11
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AUTOMATIC TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, timezone, date_format, time_format)
    VALUES (NEW.id, 'Asia/Kolkata', 'YYYY-MM-DD', '12h')
    ON CONFLICT (id) DO NOTHING;

    PERFORM public.seed_default_habits_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
