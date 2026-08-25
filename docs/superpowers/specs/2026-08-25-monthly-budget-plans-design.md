# Monthly Budget Plans — Month Picker, Snapshots & Auto-Copy

**Date:** 2026-08-25  
**Status:** Approved for implementation planning  
**Branch context:** `feat/supabase-vercel` (Family Finance + Supabase)

## Goal

Let the household view and edit budgets **per month**, with each month holding its own **category snapshot**, **planned amounts**, and **income plans**. Entering a new empty month **automatically copies** the previous month’s plan (categories + budgets + income). Changing the new month must not alter history. Viewing an old month shows **planned** vs **actual (mức ghi)** for that month.

## Requirements (locked)

| Topic | Decision |
|--------|----------|
| Category model | Per-month **snapshot** (independent copies; edits in month N do not change month N−1) |
| Auto-copy | First time a month has no plan data → auto-copy from previous month; **no confirm** |
| Manual copy | Keep “Sao chép ngân sách tháng trước”; if target month already has data → confirm overwrite (Có / Hủy) |
| What is copied | Categories snapshot + expense/income budgets + income plans |
| Viewing history | Month picker; show planned amounts and actual spend for selected month |
| Scope of UI | Plan tab (`PlanHub`) primarily |

## Non-goals

- Realtime sync of plan edits between devices beyond existing refresh/sync
- Changing how transactions store `category_id` beyond keeping stable ids when copying
- Rebuilding Insights/Home daily-advisor defaults in this change set (may benefit later from real monthly budgets)

## Intent check (user-validated)

1. New month starts from previous month’s budget **including income** (auto).
2. Can review old months: **mức ghi** (actual) + **mức dự kiến** (planned).
3. Add/edit/delete line items in the new month without affecting old months.

## Data model

### Categories (schema change)

Add `month text not null` (`YYYY-MM`) to `public.categories`.

- **New primary key:** `(household_id, month, id)`
- Rows are a full snapshot for that month (name, kind, icon, color, daily_spend, owner_scope, is_active).

**Migration of existing rows:** set `month = '2026-08'` for current seed categories (or the household’s earliest plan month if already known).

### Budgets & income plans (unchanged shape)

- `budgets.month` already exists — continue to use it; rows must reference category ids that exist **in the same month**.
- `income_plans.month` already exists — included in auto/manual copy.

### Copy semantics

From source month `S` to target month `T`:

1. If overwriting (manual confirm only): delete all `categories`, `budgets`, and `income_plans` for `(household_id, T)`.
2. Insert copies from `S` → `T`, **preserving category `id` values** so transaction `category_id` references remain usable across months when the same logical category is carried forward.
3. Planned amounts and income expected amounts copy as stored on `S`.

**Empty previous month:** auto-copy is a no-op; target stays empty (user can add categories manually).

## UI / behavior

### Month selection

- On Plan tab: control to move to previous/next month and show `YYYY-MM` (or localized month label).
- Default: current calendar month.
- All Plan budget/category/income lists filter by `selectedPlanMonth`.
- Actual spend (“mức ghi”) for a category = sum of non-deleted transactions in that month tagged with that `category_id` (same rules as today’s PlanHub actuals, but for selected month).

### Auto-copy (rule A)

When loading the Plan view (or after auth load when Plan month is current):

- Let `T` = selected/current month.
- If household has **no** categories and **no** budgets and **no** income_plans for `T`:
  - If month `T−1` has any of those → copy `T−1` → `T` automatically (no dialog).
  - Else → leave empty.

If `T` already has any plan data → **do not** auto-overwrite.

### Manual copy button

- Label: “Sao chép ngân sách tháng trước”.
- If `T` empty → copy immediately.
- If `T` has data → confirm: “Tháng này đã có dữ liệu — ghi đè?” (Có / Hủy).

### Edits

- Add / rename / delete category, change planned amount, edit income plans → persist only for `selectedPlanMonth` via existing Supabase sync path (after schema supports `month` on categories).

## AppState / sync impact

- `Category` type gains `month: string`.
- Load: fetch categories (all months or filter client-side); Plan UI filters by `selectedPlanMonth`.
- Sync: upsert/delete categories must include `month` in row mapping and conflict target `(household_id, month, id)`.
- Prefer keeping `selectedPlanMonth` in React state (not necessarily persisted); optional later: store last viewed month in `household_settings`.

## Error handling

- Auto/manual copy failure → keep prior UI state; show clear error.
- No previous month data → no auto-copy; empty state with prompt to add categories.
- Month change while a debounced sync is pending → flush or cancel debounce consistently before switching filter context (avoid writing the wrong month).

## Testing

- Empty new month + previous month populated → auto-copy creates matching categories, budgets, income_plans for new month.
- New month already populated → auto-copy does nothing.
- Edit/delete category in month T → month T−1 unchanged.
- Select old month → planned and actual match that month’s rows/transactions.
- Manual copy with confirm overwrites; cancel leaves data intact.
- Migration: existing Aug 2026 categories get `month = '2026-08'` and still load.

## Out of scope notes

- Home “daily advisor” hardcoded 15M fallback may still apply when selected month has no daily budgets; fixing that fallback can be a follow-up once monthly budgets are reliable.
