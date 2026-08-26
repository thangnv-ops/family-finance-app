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
