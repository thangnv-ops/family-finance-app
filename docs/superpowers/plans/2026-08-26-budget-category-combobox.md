# Budget Category Combobox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the add-budget category `<select>` with a combobox that finds-or-creates categories by name on save, and blocks duplicate expense limits for the same category in the selected month.

**Architecture:** Pure helpers in `src/lib/categories.ts` normalize names, find matches, build default expense categories, and resolve add-budget category outcome. `PlanHub` uses a small inline combobox (text + filtered suggestions) and calls `onAddCategory` then `onAddBudget` only when resolve succeeds. Edit modal stays unchanged.

**Tech Stack:** Vite, React 19, TypeScript, Vitest, existing `PlanHub` / `App` state patterns.

## Global Constraints

- Combobox: type name + live filter of existing expense/BOTH categories (case-insensitive substring).
- Name match on save: trim + case-insensitive exact equality; diacritics still matter.
- Existing category with `EXPENSE_LIMIT` in current plan month → do **not** save; alert: `Danh mục này đã có hạn mức trong tháng. Vui lòng dùng Sửa hạn mức để thay đổi.`
- Unknown name → create category then budget on save.
- New category defaults: `kind: 'EXPENSE'`, `icon: 'Tag'`, `color: '#64748b'`, `dailySpend: false`, `ownerScope: 'ALL'`, `isActive: true`.
- Empty name alert: `Vui lòng nhập tên danh mục`.
- Edit budget modal: unchanged.
- Categories remain shared across months (no per-month category snapshot in this plan).
- Work in worktree `/Users/thangnv/Documents/github/family-finance-app/.worktrees/feat/budget-category-by-name` on branch `feat/budget-category-by-name`.
- Spec: `docs/superpowers/specs/2026-08-26-budget-category-combobox-design.md`.

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `src/lib/categories.ts` | Pure: normalize, find-by-name, create defaults, resolve add-budget category |
| `src/lib/categories.test.ts` | Unit tests for helpers + resolve outcomes |
| `src/components/plan/PlanHub.tsx` | Combobox UI in add modal; wire resolve + `onAddCategory` on save |
| `src/App.tsx` | `onAddCategory` appends to `appState.categories` with generated id |

---

### Task 1: Category name helpers

**Files:**
- Create: `src/lib/categories.ts`
- Create: `src/lib/categories.test.ts`

**Interfaces:**
- Produces:
  - `normalizeCategoryName(name: string): string`
  - `findCategoryByName(categories: Category[], name: string, kinds?: CategoryKind[]): Category | undefined`
  - `createDefaultExpenseCategory(name: string): Omit<Category, 'id'>`
  - `filterCategoriesByQuery(categories: Category[], query: string, kinds?: CategoryKind[]): Category[]`
  - `resolveBudgetCategoryForAdd(input: { name: string; categories: Category[]; budgets: Budget[]; month: string }): { ok: true; categoryId: string; createCategory?: Omit<Category, 'id'> } | { ok: false; error: 'EMPTY_NAME' | 'ALREADY_HAS_BUDGET' }`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Budget, Category } from '../types/finance';
import {
  createDefaultExpenseCategory,
  filterCategoriesByQuery,
  findCategoryByName,
  normalizeCategoryName,
  resolveBudgetCategoryForAdd,
} from './categories';

const categories: Category[] = [
  {
    id: 'cat_bao_hiem',
    name: 'Bảo hiểm',
    kind: 'EXPENSE',
    icon: 'ShieldCheck',
    color: '#14b8a6',
    dailySpend: false,
    ownerScope: 'ALL',
    isActive: true,
  },
  {
    id: 'cat_luong',
    name: 'Lương',
    kind: 'INCOME',
    icon: 'Briefcase',
    color: '#2563eb',
    dailySpend: false,
    ownerScope: 'ALL',
    isActive: true,
  },
];

describe('normalizeCategoryName', () => {
  it('trims and lowercases', () => {
    expect(normalizeCategoryName('  Bảo Hiểm  ')).toBe('bảo hiểm');
  });
});

describe('findCategoryByName', () => {
  it('matches case-insensitively among expense kinds by default', () => {
    expect(findCategoryByName(categories, 'bảo hiểm')?.id).toBe('cat_bao_hiem');
    expect(findCategoryByName(categories, 'Lương')).toBeUndefined();
  });
});

describe('filterCategoriesByQuery', () => {
  it('filters expense categories by substring ignore case', () => {
    const result = filterCategoriesByQuery(categories, 'bảo');
    expect(result.map((c) => c.id)).toEqual(['cat_bao_hiem']);
  });

  it('returns all expense categories when query is blank', () => {
    expect(filterCategoriesByQuery(categories, '  ').map((c) => c.id)).toEqual(['cat_bao_hiem']);
  });
});

describe('createDefaultExpenseCategory', () => {
  it('returns fixed defaults with trimmed name', () => {
    expect(createDefaultExpenseCategory('  Du lịch  ')).toEqual({
      name: 'Du lịch',
      kind: 'EXPENSE',
      icon: 'Tag',
      color: '#64748b',
      dailySpend: false,
      ownerScope: 'ALL',
      isActive: true,
    });
  });
});

describe('resolveBudgetCategoryForAdd', () => {
  const budgets: Budget[] = [
    {
      id: 'b1',
      month: '2026-08',
      categoryId: 'cat_bao_hiem',
      budgetType: 'EXPENSE_LIMIT',
      plannedAmount: 2_000_000,
    },
  ];

  it('returns EMPTY_NAME when blank', () => {
    expect(
      resolveBudgetCategoryForAdd({
        name: '   ',
        categories,
        budgets,
        month: '2026-08',
      })
    ).toEqual({ ok: false, error: 'EMPTY_NAME' });
  });

  it('blocks when category already has expense limit this month', () => {
    expect(
      resolveBudgetCategoryForAdd({
        name: 'bảo hiểm',
        categories,
        budgets,
        month: '2026-08',
      })
    ).toEqual({ ok: false, error: 'ALREADY_HAS_BUDGET' });
  });

  it('reuses category when no budget this month', () => {
    expect(
      resolveBudgetCategoryForAdd({
        name: 'Bảo hiểm',
        categories,
        budgets: [],
        month: '2026-08',
      })
    ).toEqual({ ok: true, categoryId: 'cat_bao_hiem' });
  });

  it('requests createCategory for unknown name', () => {
    const result = resolveBudgetCategoryForAdd({
      name: 'Du lịch',
      categories,
      budgets,
      month: '2026-08',
    });
    expect(result).toEqual({
      ok: true,
      categoryId: expect.any(String),
      createCategory: createDefaultExpenseCategory('Du lịch'),
    });
    if (result.ok && result.createCategory) {
      expect(result.categoryId.startsWith('cat_')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/categories.test.ts`

Expected: FAIL — cannot find module `./categories` (or missing exports).

- [ ] **Step 3: Implement helpers**

Create `src/lib/categories.ts`:

```ts
import type { Budget, Category, CategoryKind } from '../types/finance';

const DEFAULT_EXPENSE_KINDS: CategoryKind[] = ['EXPENSE', 'BOTH'];

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function findCategoryByName(
  categories: Category[],
  name: string,
  kinds: CategoryKind[] = DEFAULT_EXPENSE_KINDS
): Category | undefined {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return undefined;
  return categories.find(
    (c) =>
      c.isActive &&
      kinds.includes(c.kind) &&
      normalizeCategoryName(c.name) === normalized
  );
}

export function filterCategoriesByQuery(
  categories: Category[],
  query: string,
  kinds: CategoryKind[] = DEFAULT_EXPENSE_KINDS
): Category[] {
  const q = normalizeCategoryName(query);
  return categories.filter((c) => {
    if (!c.isActive || !kinds.includes(c.kind)) return false;
    if (!q) return true;
    return normalizeCategoryName(c.name).includes(q);
  });
}

export function createDefaultExpenseCategory(name: string): Omit<Category, 'id'> {
  return {
    name: name.trim(),
    kind: 'EXPENSE',
    icon: 'Tag',
    color: '#64748b',
    dailySpend: false,
    ownerScope: 'ALL',
    isActive: true,
  };
}

export type ResolveBudgetCategoryResult =
  | { ok: true; categoryId: string; createCategory?: Omit<Category, 'id'> }
  | { ok: false; error: 'EMPTY_NAME' | 'ALREADY_HAS_BUDGET' };

export function resolveBudgetCategoryForAdd(input: {
  name: string;
  categories: Category[];
  budgets: Budget[];
  month: string;
}): ResolveBudgetCategoryResult {
  const trimmed = input.name.trim();
  if (!trimmed) return { ok: false, error: 'EMPTY_NAME' };

  const existing = findCategoryByName(input.categories, trimmed);
  if (existing) {
    const hasBudget = input.budgets.some(
      (b) =>
        b.month === input.month &&
        b.categoryId === existing.id &&
        b.budgetType === 'EXPENSE_LIMIT'
    );
    if (hasBudget) return { ok: false, error: 'ALREADY_HAS_BUDGET' };
    return { ok: true, categoryId: existing.id };
  }

  const createCategory = createDefaultExpenseCategory(trimmed);
  const categoryId = `cat_${Date.now()}`;
  return { ok: true, categoryId, createCategory };
}
```

Note: for the “unknown name” unit test, `Date.now()` makes `categoryId` non-deterministic — keep `expect.any(String)` + `startsWith('cat_')` as written. Do **not** assert a fixed timestamp.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/categories.test.ts`

Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/categories.ts src/lib/categories.test.ts
git commit -m "$(cat <<'EOF'
feat: add category find-or-create helpers for budget limits

EOF
)"
```

---

### Task 2: Wire `onAddCategory` in App

**Files:**
- Modify: `src/App.tsx` (PlanHub props near `onAddBudget`)
- Modify: `src/components/plan/PlanHub.tsx` (props interface + destructure only; no UI yet)

**Interfaces:**
- Consumes: `createDefaultExpenseCategory` shape from Task 1; `resolveBudgetCategoryForAdd` may supply a provisional `categoryId`
- Produces: `onAddCategory?: (category: Category | Omit<Category, 'id'>) => string` — App persists and returns the final `id` (reuse provisional id when provided)

- [ ] **Step 1: Add prop to PlanHub**

In `PlanHubProps`, after `onAddBudget`:

```ts
  onAddCategory?: (category: Category | Omit<Category, 'id'>) => string;
```

Destructure `onAddCategory` next to `onAddBudget` in the component params.

- [ ] **Step 2: Wire App handler**

In `src/App.tsx`, next to `onAddBudget`:

```tsx
            onAddCategory={(c) => {
              const id = 'id' in c && c.id ? c.id : `cat_${Date.now()}`;
              setAppState((p) => ({
                ...p,
                categories: [...p.categories, { ...c, id }],
              }));
              return id;
            }}
```

This keeps the id from `resolveBudgetCategoryForAdd` stable when PlanHub passes `{ ...createCategory, id: resolved.categoryId }`.

- [ ] **Step 3: Typecheck**

Run: `npm run lint`

Expected: PASS (`tsc --noEmit`). Unused destructured `onAddCategory` until Task 3 is fine.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/plan/PlanHub.tsx
git commit -m "$(cat <<'EOF'
feat: wire onAddCategory for plan budget flow

EOF
)"
```

---

### Task 3: Add-budget combobox + resolve-on-save

**Files:**
- Modify: `src/components/plan/PlanHub.tsx` (state, open/save handlers, add-modal JSX ~lines 277–280, 350–394, 1394–1475)
- Import from: `src/lib/categories.ts`

**Interfaces:**
- Consumes: `filterCategoriesByQuery`, `resolveBudgetCategoryForAdd`, `onAddCategory`, `onAddBudget`
- Produces: Add modal uses `budgetCategoryName` string; edit modal keeps `budgetCategoryId`

- [ ] **Step 1: Replace add-modal category state**

Keep `budgetCategoryId` for **edit** modal.

Add:

```ts
  const [budgetCategoryName, setBudgetCategoryName] = useState('');
  const [categorySuggestOpen, setCategorySuggestOpen] = useState(false);
```

Update `handleOpenAddBudget`:

```ts
  const handleOpenAddBudget = () => {
    setBudgetCategoryName('');
    setBudgetPlannedAmount('');
    setCategorySuggestOpen(false);
    setShowAddBudgetModal(true);
  };
```

- [ ] **Step 2: Update `handleSaveBudget` add branch**

Replace the add branch so edit still uses `budgetCategoryId`, add uses resolve:

```ts
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(budgetPlannedAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (amount <= 0) {
      alert('Vui lòng nhập hạn mức lớn hơn 0');
      return;
    }

    if (editingBudget) {
      if (!budgetCategoryId) return;
      onUpdateBudget({
        ...editingBudget,
        categoryId: budgetCategoryId,
        plannedAmount: amount,
      });
      setEditingBudget(null);
      return;
    }

    const resolved = resolveBudgetCategoryForAdd({
      name: budgetCategoryName,
      categories: filteredCategories,
      budgets: filteredBudgets,
      month: currentYM,
    });

    if (!resolved.ok) {
      if (resolved.error === 'EMPTY_NAME') {
        alert('Vui lòng nhập tên danh mục');
      } else {
        alert(
          'Danh mục này đã có hạn mức trong tháng. Vui lòng dùng Sửa hạn mức để thay đổi.'
        );
      }
      return;
    }

    let categoryId = resolved.categoryId;
    if (resolved.createCategory && onAddCategory) {
      categoryId = onAddCategory({ ...resolved.createCategory, id: resolved.categoryId });
    } else if (resolved.createCategory && !onAddCategory) {
      alert('Không thể tạo danh mục mới');
      return;
    }

    if (onAddBudget) {
      onAddBudget({
        month: currentYM,
        categoryId,
        budgetType: 'EXPENSE_LIMIT',
        plannedAmount: amount,
      });
    }
    setShowAddBudgetModal(false);
  };
```

Import at top:

```ts
import { filterCategoriesByQuery, resolveBudgetCategoryForAdd } from '../../lib/categories';
```

- [ ] **Step 3: Replace add-modal `<select>` with combobox**

Inside `{showAddBudgetModal && (...)}` category field, replace the `<select>` block with:

```tsx
            <div className="relative">
              <label className="block text-slate-700 mb-1 font-semibold">Danh mục chi tiêu</label>
              <input
                type="text"
                value={budgetCategoryName}
                onChange={(e) => {
                  setBudgetCategoryName(e.target.value);
                  setCategorySuggestOpen(true);
                }}
                onFocus={() => setCategorySuggestOpen(true)}
                onBlur={() => {
                  // defer so suggestion click registers
                  window.setTimeout(() => setCategorySuggestOpen(false), 150);
                }}
                placeholder="Gõ tên hoặc chọn danh mục"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
                autoComplete="off"
              />
              {categorySuggestOpen && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filterCategoriesByQuery(filteredCategories, budgetCategoryName).map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-slate-800 hover:bg-indigo-50 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setBudgetCategoryName(cat.name);
                          setCategorySuggestOpen(false);
                        }}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                  {filterCategoriesByQuery(filteredCategories, budgetCategoryName).length === 0 && (
                    <li className="px-3 py-2 text-slate-500">Không có gợi ý — sẽ tạo danh mục mới khi lưu</li>
                  )}
                </ul>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Gõ để tìm danh mục có sẵn. Tên mới sẽ tạo danh mục khi lưu. Nếu đã có hạn mức tháng này, hãy dùng Sửa hạn mức.
              </p>
            </div>
```

Remove the old “(Đã có hạn mức - sẽ cập nhật)” options from the **add** modal only. Leave the **edit** modal `<select>` as-is.

- [ ] **Step 4: Manual smoke check (dev)**

Run: `npm run dev`

Verify:

1. Open Thêm hạn mức → typing filters suggestions.
2. Pick existing category without budget → saves.
3. Pick/type name that already has limit → alert, modal stays open.
4. Type brand-new name → new category appears in list after save; budget row shows that name.

- [ ] **Step 5: Run unit tests + lint**

Run:

```bash
npm test -- src/lib/categories.test.ts
npm run lint
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/plan/PlanHub.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
feat: combobox find-or-create category when adding budget limit

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Combobox type + live filter | Task 3 |
| Case-insensitive exact match on save | Task 1 `findCategoryByName` / `resolveBudgetCategoryForAdd` |
| Reuse existing category without month budget | Task 1 + 3 |
| Block if already has month limit | Task 1 + 3 |
| Create new category with fixed defaults | Task 1 + 2 + 3 |
| Edit modal unchanged | Task 3 (edit path untouched) |
| Error copy (VN) | Task 3 |
| Helper unit tests | Task 1 |
| `onAddCategory` wiring | Task 2 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-26-budget-category-combobox.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints  

Which approach?
