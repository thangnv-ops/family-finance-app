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
