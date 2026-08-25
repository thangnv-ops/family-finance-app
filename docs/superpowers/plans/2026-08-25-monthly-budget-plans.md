# Monthly Budget Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-month category snapshots with month picker, auto-copy from previous month when empty, manual copy-with-confirm, and planned vs actual for any selected month on the Plan tab.

**Architecture:** Add `month` to `categories` (PK `(household_id, month, id)`). Pure helpers copy categories+budgets+income_plans between months. PlanHub holds `selectedPlanMonth`, filters lists, runs auto-copy on empty months, and exposes a manual copy button. Sync/mappers include `month` and upsert on the new conflict target.

**Tech Stack:** Vite, React 19, TypeScript, Supabase Postgres + RLS, Vitest, existing `PlanHub` / `AppState` sync.

## Global Constraints

- Category model: per-month **snapshot** (edits in month N must not change month N−1).
- Auto-copy: first time a month has **no** categories AND **no** budgets AND **no** income_plans → copy from previous month; **no confirm**.
- Manual copy: “Sao chép ngân sách tháng trước”; if target has data → confirm “Tháng này đã có dữ liệu — ghi đè?” (Có / Hủy).
- Copy includes: categories + budgets + income_plans; **preserve category `id`** values.
- Plan tab only for picker/copy UI; actual spend = transactions in selected month for that `category_id`.
- Existing Aug 2026 categories migrate to `month = '2026-08'`.
- Do not change Home daily-advisor 15M fallback in this plan.
- Work in worktree `/Users/thangnv/Documents/github/family-finance-app/.worktrees/feat-supabase-vercel` on `feat/supabase-vercel`.
- Supabase project id: `ysxhprvlxflhmeaiujfp`.

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `supabase/migrations/20260825230000_categories_month.sql` | Add `month` to categories; migrate existing rows; new PK |
| `src/types/finance.ts` | `Category.month: string` |
| `src/lib/formatters.ts` | `shiftMonth(ym, delta)`, reuse `getCurrentMonthStr` / `formatMonthVN` |
| `src/lib/planMonth.ts` | Pure: `monthHasPlanData`, `copyPlanMonth`, `filterPlanForMonth` |
| `src/lib/planMonth.test.ts` | Unit tests for copy/filter/auto rules |
| `src/lib/db/mappers.ts` | category row mapping includes `month`; upsert conflict |
| `src/lib/db/syncState.ts` | Delete/upsert categories keyed by month+id |
| `src/lib/emptyState.ts` / seed SQL | Categories created with a `month` |
| `src/components/plan/PlanMonthBar.tsx` | Prev/next month + copy button + confirm dialog |
| `src/components/plan/PlanHub.tsx` | `selectedPlanMonth`, filter, auto-copy effect, wire bar |
| `src/App.tsx` | Pass month-aware category handlers if needed; ensure new categories get `month` |
| `supabase/seed/2026-08-categories-budgets.sql` | Include `month` in inserts |

---

### Task 1: Migration — categories.month

**Files:**
- Create: `supabase/migrations/20260825230000_categories_month.sql`

**Interfaces:**
- Produces: `categories.month text not null`; PK `(household_id, month, id)`

- [ ] **Step 1: Write migration SQL**

```sql
-- Add month to categories; backfill; rebuild PK
alter table public.categories add column if not exists month text;

update public.categories set month = '2026-08' where month is null;

alter table public.categories alter column month set not null;

alter table public.categories drop constraint if exists categories_pkey;
alter table public.categories add primary key (household_id, month, id);

create index if not exists categories_household_month_idx
  on public.categories (household_id, month);
```

Re-enable / keep existing RLS policies (they key off `household_id` only — no change required unless policies reference PK).

- [ ] **Step 2: Apply to remote**

Prefer MCP `apply_migration` name `categories_month` with the SQL. If denied, `execute_sql` then record history with a no-op `apply_migration` if needed (same pattern as prior tasks).

Verify:

```sql
select month, count(*) from public.categories group by month;
```

Expected: `2026-08` with existing category count.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260825230000_categories_month.sql
git commit -m "db: add month to categories for per-month snapshots"
```

---

### Task 2: Types, formatters, mappers, sync (TDD helpers next)

**Files:**
- Modify: `src/types/finance.ts`
- Modify: `src/lib/formatters.ts`
- Modify: `src/lib/db/mappers.ts`
- Modify: `src/lib/db/mappers.test.ts`
- Modify: `src/lib/db/syncState.ts`
- Modify: `supabase/seed/2026-08-categories-budgets.sql`

**Interfaces:**
- `Category.month: string`
- `shiftMonth(ym: string, deltaMonths: number): string` — e.g. `shiftMonth('2026-08', -1) === '2026-07'`
- `categoryToRow` / `rowToCategory` include `month`
- Category upsert `onConflict: 'household_id,month,id'`
- Deletes for categories: `.eq('household_id').eq('month', item.month).in('id', deleteIds)` **or** delete by composite — when planning deletes, group by month

- [ ] **Step 1: Add failing formatter test**

In `src/lib/formatters.test.ts` (create if missing):

```ts
import { describe, it, expect } from 'vitest';
import { shiftMonth } from './formatters';

describe('shiftMonth', () => {
  it('goes to previous month', () => {
    expect(shiftMonth('2026-08', -1)).toBe('2026-07');
  });
  it('crosses year boundary', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});
```

- [ ] **Step 2: Run FAIL, implement `shiftMonth`, PASS**

```ts
export function shiftMonth(ym: string, deltaMonths: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}
```

- [ ] **Step 3: Update Category type + mappers + mapper test round-trip includes month**

- [ ] **Step 4: Fix syncState category delete/upsert for composite key**

When syncing categories, for deletes use:

```ts
// For each month group in deleteIds, or delete with .eq('month', cat.month)
```

Simplest correct approach: load prev/next category objects; for each id in `deleteIds`, find the prev item and delete with `.eq('household_id', householdId).eq('month', prevItem.month).eq('id', id)`.

Upsert: `onConflict: 'household_id,month,id'`.

- [ ] **Step 5: Update seed SQL inserts to set `month = '2026-08'`**

- [ ] **Step 6: `npm test` PASS; commit**

```bash
git add src/types/finance.ts src/lib/formatters.ts src/lib/formatters.test.ts src/lib/db/mappers.ts src/lib/db/mappers.test.ts src/lib/db/syncState.ts supabase/seed/2026-08-categories-budgets.sql
git commit -m "feat: month-aware categories in types, mappers, and sync"
```

---

### Task 3: Pure plan-month copy helpers (TDD)

**Files:**
- Create: `src/lib/planMonth.ts`
- Create: `src/lib/planMonth.test.ts`

**Interfaces:**
- `monthHasPlanData(state, month): boolean` — true if any category/budget/incomePlan has that month
- `filterCategories(state, month)`, `filterBudgets`, `filterIncomePlans`
- `copyPlanMonth(state, fromMonth, toMonth, { overwrite: boolean }): AppState`
  - If `!overwrite && monthHasPlanData(state, toMonth)` → return state unchanged
  - If overwrite → remove all categories/budgets/incomePlans for `toMonth`, then append clones from `fromMonth` with `.month = toMonth` (and budget/income `month = toMonth`), **same ids**
- `ensurePlanMonth(state, month): { state: AppState; didAutoCopy: boolean }`
  - If `monthHasPlanData(state, month)` → `{ state, didAutoCopy: false }`
  - Else copy from `shiftMonth(month, -1)` if source has data; else unchanged

- [ ] **Step 1: Write tests covering auto-copy, no overwrite, overwrite copy, independence of months**

- [ ] **Step 2: FAIL → implement → PASS**

- [ ] **Step 3: Commit**

```bash
git add src/lib/planMonth.ts src/lib/planMonth.test.ts
git commit -m "feat: add plan month copy and filter helpers"
```

---

### Task 4: PlanMonthBar UI

**Files:**
- Create: `src/components/plan/PlanMonthBar.tsx`

**Interfaces:**
- Props:
  - `month: string`
  - `onMonthChange: (ym: string) => void`
  - `onCopyPrevious: () => void`
  - `copyDisabled?: boolean`

- [ ] **Step 1: Implement bar**

- Prev / Next buttons calling `shiftMonth(month, ±1)`
- Label via `formatMonthVN(month)`
- Button “Sao chép ngân sách tháng trước” → `onCopyPrevious`

Match existing PlanHub Tailwind styles (slate/blue, compact).

- [ ] **Step 2: Commit**

```bash
git add src/components/plan/PlanMonthBar.tsx
git commit -m "feat: add Plan month picker and copy button bar"
```

---

### Task 5: Wire PlanHub — filter, auto-copy, confirm overwrite

**Files:**
- Modify: `src/components/plan/PlanHub.tsx`
- Modify: `src/App.tsx` (category create/update must set `month: selectedPlanMonth`; filter daily advisor still uses current month budgets globally — out of scope to change Home)

**Interfaces:**
- PlanHub state: `selectedPlanMonth` default `getCurrentMonthStr()`
- On mount / when `selectedPlanMonth` or plan collections change: call `ensurePlanMonth`; if `didAutoCopy`, `onReplacePlanData(nextState)` or granular callbacks to update categories/budgets/incomePlans in parent
- Prefer a single callback `onApplyPlanState: (partial: Pick<AppState, 'categories' | 'budgets' | 'incomePlans'>) => void` from App to avoid full state races

**Manual copy:**
```ts
if (monthHasPlanData(appState, selectedPlanMonth)) {
  if (!window.confirm('Tháng này đã có dữ liệu — ghi đè?')) return;
  apply copyPlanMonth(..., { overwrite: true });
} else {
  apply copyPlanMonth(..., { overwrite: false });
}
```

**Filtering:**
- Use filtered categories/budgets/incomePlans for all Plan lists and actuals (`transactionDate.startsWith(selectedPlanMonth)`).

**Adding category/budget/income in PlanHub:**
- Always stamp `month: selectedPlanMonth`.

- [ ] **Step 1: Wire selectedPlanMonth + PlanMonthBar + filters**

- [ ] **Step 2: Auto-copy via `ensurePlanMonth` once per empty month (guard with ref to avoid loops)**

- [ ] **Step 3: Manual copy + confirm**

- [ ] **Step 4: Fix App handlers that create categories to include month (search `categories:` / onAddCategory)**

- [ ] **Step 5: Manual smoke — `npm test`, `npm run lint`**

- [ ] **Step 6: Commit**

```bash
git add src/components/plan/PlanHub.tsx src/App.tsx src/components/plan/PlanMonthBar.tsx
git commit -m "feat: month picker, auto-copy, and plan filters in PlanHub"
```

---

### Task 6: Verify remote data + push

**Files:** none required unless seed re-apply

- [ ] **Step 1: Confirm DB categories have month**

```sql
select month, id, name from public.categories order by name limit 5;
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Report done** — note PR #1 can be updated with this feature

---

## Self-Review (plan vs spec)

| Spec item | Task |
|-----------|------|
| categories.month + PK | 1 |
| migrate 2026-08 | 1 |
| mappers/sync month | 2 |
| copy helpers + auto rule | 3 |
| month picker UI | 4 |
| PlanHub filter + actuals by month | 5 |
| auto-copy no confirm | 3, 5 |
| manual copy + confirm | 5 |
| preserve category ids | 3 |
| push/verify | 6 |
