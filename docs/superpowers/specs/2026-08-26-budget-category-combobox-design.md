# Budget Limit — Category Combobox (Find-or-Create by Name)

**Date:** 2026-08-26  
**Status:** Approved for implementation planning  
**Branch:** `feat/budget-category-by-name`

## Goal

In **Thêm hạn mức ngân sách**, let the user type or pick a category name. Reuse an existing category when the name matches (case-insensitive); otherwise create a new expense category on save. If that category already has an expense limit for the current month, block save and require the **Sửa hạn mức** modal.

## Requirements (locked)

| Topic | Decision |
|--------|----------|
| UI control | Combobox: type name + live filter/suggest existing expense categories |
| Name match | Trim whitespace; case-insensitive (`"bảo hiểm"` = `"Bảo hiểm"`). Diacritics still matter |
| Existing name, no budget this month | Reuse category `id`, create budget |
| Existing name, budget already this month | **Error — do not save**; user must edit via “Sửa hạn mức” |
| Unknown name | Create new `Category` on save, then create budget |
| New category defaults | `kind: EXPENSE`, fixed icon/color, `dailySpend: false`, `ownerScope: 'ALL'`, `isActive: true` |
| Edit modal | Unchanged (no combobox) |
| Resolve timing | On save only (approach 1) |

## Non-goals

- Editing category metadata (icon/color/dailySpend) from this modal
- Renaming existing categories
- Accent/diacritic-insensitive matching
- Changing how transactions pick categories (new categories become available globally because categories are shared)
- Per-month category snapshots (categories remain shared across months)

## Current state

- Add-budget modal uses a `<select>` of expense/BOTH categories.
- Selecting a category that already has a limit shows “(Đã có hạn mức - sẽ cập nhật)” and `onAddBudget` upserts by `(categoryId, month)`.
- There is no `onAddCategory` path today.

## Design

### UI — Add budget modal

Replace the category `<select>` with a combobox:

1. Text input bound to `budgetCategoryName` (string).
2. While focused / typing, show a filtered list of active expense (or BOTH) categories whose names match the query (case-insensitive substring).
3. Choosing a suggestion fills the input with that category’s display name.
4. Short helper under the field:
   - Name chưa có → tạo danh mục mới khi lưu.
   - Danh mục đã có hạn mức tháng này → không lưu được; dùng Sửa hạn mức.

Remove the “sẽ cập nhật” option labeling from the add flow.

### Save flow (`handleSaveBudget` for add)

1. Validate amount `> 0` (existing).
2. `name = trim(budgetCategoryName)`; if empty → error (“Vui lòng nhập tên danh mục”).
3. `existing = findCategoryByName(categories, name)` among active EXPENSE/BOTH (normalize: trim + lower-case compare).
4. If `existing` and current month already has `EXPENSE_LIMIT` for `existing.id` → **alert/error and return** (do not call `onAddBudget`).
5. If `!existing`:
   - Build category via `createDefaultExpenseCategory(name)`.
   - Call `onAddCategory(category)` (or equivalent state update that appends to `categories`).
   - Use new `id` as `categoryId`.
6. Else use `existing.id`.
7. Call `onAddBudget({ month, categoryId, budgetType: 'EXPENSE_LIMIT', plannedAmount })`.

`onAddBudget` in `App` may keep its upsert filter for safety, but the add modal must not rely on upsert for the “already has limit” case — that case is an explicit error.

### Helpers

Small pure helpers (e.g. `src/lib/categories.ts`):

- `normalizeCategoryName(name: string): string` — trim + lower-case
- `findCategoryByName(categories, name, kinds?): Category | undefined`
- `createDefaultExpenseCategory(name: string): Omit<Category, 'id'> | Category`  
  Defaults (fixed):
  - `icon: 'Tag'`
  - `color: '#64748b'`
  - `kind: 'EXPENSE'`
  - `dailySpend: false`
  - `ownerScope: 'ALL'`
  - `isActive: true`

Id assignment: same pattern as other entities (`cat_${Date.now()}` or equivalent in `App` when appending).

### Wiring

- `PlanHub`: new optional `onAddCategory?: (category: Omit<Category, 'id'> | Category) => void` (match existing fund/budget prop style).
- `App.tsx`: append to `appState.categories` with generated `id` if missing.

### Edit budget modal

No change. Category stays read-only / existing select behavior as today.

## Error copy (VN)

- Empty name: `Vui lòng nhập tên danh mục`
- Amount ≤ 0: existing message
- Already has limit this month:  
  `Danh mục này đã có hạn mức trong tháng. Vui lòng dùng Sửa hạn mức để thay đổi.`

## Testing

Unit tests for helpers:

1. Case-insensitive find after trim.
2. No match → `createDefaultExpenseCategory` shape.
3. Save-path logic (or thin wrapper): matching name with existing month budget → blocked; without → proceeds; unknown name → create then add.

## Success criteria

- User can add a limit for a brand-new category name in one save.
- Typing filters existing categories; picking one reuses that category.
- Duplicate limit for the same category in the same month is refused on add.
- New categories appear in later category lists (shared category model).
