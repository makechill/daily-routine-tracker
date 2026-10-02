# Personal Daily Routine Tracker

An elegant, minimalist, high-performance web application designed for private daily routine recording, deep historical analytics, dynamic habit customization without code changes, and full data sovereignty (filtered Excel/JSON exports, manual verified snapshots, and safe restore workflows).

---

## Architecture & Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 14+ (App Router) with React 18
- **Language**: TypeScript with strict mode enabled
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a restrained, custom palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with strict Row Level Security, Supabase Auth via `@supabase/ssr`)
- **Export Engines**: [ExcelJS](https://github.com/exceljs/exceljs) for multi-sheet `.xlsx` generation and native structured JSON streaming
- **Schema Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) for unit, date, and export engine tests

---

## Design System & Color Palette

The interface follows a bespoke, calm palette tailored for daily productivity:

- **Primary Background**: Warm off-white (`#F8F9F6`)
- **Main Surface**: Pure white (`#FFFFFF`)
- **Primary Text**: Deep charcoal (`#252923`)
- **Secondary Text**: Muted gray (`#73786F`)
- **Primary Accent**: Sophisticated forest green (`#3F6B52`)
- **Subtle Accent Background**: Pale sage (`#EAF0E8`)
- **Borders**: Soft neutral gray (`#E5E8E1`)
- **Status Indicators**:
  - Success: `#2E7D32` (accessible green)
  - Warning: `#D97706` (muted amber)
  - Error: `#DC2626` (accessible red)

---

## Application Sections

1. **Dashboard** (`/dashboard`):
   - Daily progress ring and completion percentage.
   - Current completion streak and all-time longest streak.
   - 7-day consistency sparkline/bar breakdown.
   - 30-day consistency rate and total activities logged.
   - Target vs. actual wake-up and sleeping times.
   - Today's habits overview with quick-action links.

2. **Today's Routine** (`/routine`):
   - Fast routine recorder with minimal typing and scrolling.
   - Previous/Next day navigation, Date picker, and "Go to Today" shortcut.
   - **Copy Yesterday**: One-tap copy of yesterday's values for rapid daily logging.
   - Native time pickers (`HH:MM`) with target comparison display.
   - Automatic debounced save and explicit instant save for checkboxes.
   - Visible persistence states (`Saving...`, `All changes saved to PostgreSQL`, `Save failed`).
   - Daily reflections/notes card.

3. **History** (`/history`):
   - Dynamic matrix table (one row per date, with dynamically generated habit columns).
   - Date range presets (Past 7 Days, Past 30 Days, This Month, Custom Date Range).
   - Column visibility controls (toggle individual habit columns on/off).
   - Full-text search across reflections, habit values, and dates.
   - Direct click-through to edit any historical day's log.
   - Sticky date column on desktop with responsive horizontal scrolling.

4. **Analytics** (`/analytics`):
   - Real-time calculations derived directly from persisted PostgreSQL records.
   - Daily completion stats and target comparisons.
   - Activity-specific weekly totals (Workout minutes, Learning minutes, Walking count, YouTube uploads).
   - Per-habit streaks and consistency percentages, respecting activation dates and scheduled weekly days.

5. **Manage Habits** (`/habits`):
   - Dynamic habit creator/editor modal.
   - Supported field types: Checkbox, Time, Text, Number, Duration, URL, Dropdown Select, Date.
   - Configurable targets, categories, weekday schedules, and completion metric toggles.
   - Habit reordering (move up/down display order).
   - Archiving and reactivation (preserves all historical logs in history and exports without data loss).

6. **Data & Exports** (`/exports`):
   - **Filtered Excel Export** (`.xlsx`): Multi-sheet workbook including *Daily Records* (matrix), *Habit Entries* (normalized), *Habit Definitions*, and *Summary*.
   - **Filtered JSON Export** (`.json`): Structured versioned payload (`schemaVersion: 1`).
   - Granular filters: Date ranges, habit multi-select, completion status (all/completed/incomplete), categories, keywords.
   - Formula injection escaping (prevents Excel command execution).
   - **Manual Archive & Snapshots**: Creates point-in-time snapshots with SHA-256 integrity verification.
   - **Safe Restore Wizard**: Uploads JSON backups, validates schema, previews conflicts, and provides safe "Merge" or "Replace Range" execution with explicit confirmation.

7. **Settings** (`/settings`):
   - Timezone configuration (default: `Asia/Kolkata` to prevent UTC midnight date shifting).
   - Time format (`12h` vs `24h`) and First day of week (Monday vs Sunday).
   - Security and session details with sign out action.

---

## Local Setup & Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or v20+ (LTS recommended)
- `npm` or `pnpm`
- A [Supabase](https://supabase.com/) project (free tier is fully compatible)

### Step 1: Clone & Install

```bash
cd daily-routine-tracker
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata
```

### Step 3: Run Database Migrations in Supabase

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Create a new query.
3. Paste the contents of `supabase/migrations/001_initial_schema.sql`.
4. Click **Run**.
5. This creates the `profiles`, `habits`, `daily_records`, `habit_entries`, and `archive_snapshots` tables, enables Row Level Security (RLS), configures policies (`auth.uid() = user_id`), and installs the default habit seeder.

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

To execute the unit and integration test suite:

```bash
npm test
```

The test suite covers:
- **Date Utilities**: Timezone-safe calculations in `Asia/Kolkata`, day-of-week parsing, date ranges, and future date checks without UTC shift bugs.
- **Habit Logic**: Applicable days, activation dates, archiving behavior, field type completion evaluation, and zero-division guard.
- **Streak Engine**: Consecutive streak evaluation across scheduled days without penalizing non-scheduled days.
- **Export Engine**: Filtering by date, habits, completion status, category, Excel buffer generation, and formula escaping.
- **Import Engine**: Zod schema validation, malformed file rejection, conflict detection (dates & habit IDs).

---

## Production Build

To build the optimized production application:

```bash
npm run build
```

To run the production server:

```bash
npm start
```

---

## Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `daily-routine-tracker` repository.
4. In the **Environment Variables** section, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Publishable Key.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Same as Anon Key.
   - `NEXT_PUBLIC_APP_TIMEZONE`: `Asia/Kolkata`
5. Click **Deploy**.
6. Once deployed, add your Vercel production domain to Supabase:
   - Supabase Dashboard -> **Authentication** -> **URL Configuration**.
   - Set **Site URL** to your Vercel production URL (e.g., `https://your-routine-tracker.vercel.app`).
   - Add `https://your-routine-tracker.vercel.app/**` to **Redirect URLs**.

---

## Free-Tier Limitations & Storage Guidance

- **Supabase Free Plan**:
  - Provides 500 MB of PostgreSQL storage (sufficient for decades of single-user routine entries).
  - Unused Supabase free projects pause after 1 week of inactivity. Logging in or opening the app routinely keeps the project active.
- **Vercel Free Hobby Plan**:
  - Full support for Next.js App Router, SSR, Server Actions, and Route Handlers.
  - Export streaming is handled dynamically with no filesystem write dependencies.

---

## License

Private, personal productivity project. All rights reserved.
