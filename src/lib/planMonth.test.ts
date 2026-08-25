import { describe, expect, it } from 'vitest';
import type { AppState } from './storage';
import {
  copyPlanMonth,
  ensurePlanMonth,
  filterBudgets,
  filterCategories,
  filterIncomePlans,
  monthHasPlanData,
} from './planMonth';

function makeState(): AppState {
  return {
    categories: [
      { id: 'food', month: '2026-07', name: 'Food', kind: 'EXPENSE', icon: 'food', color: 'red', dailySpend: true, isActive: true },
      { id: 'rent', month: '2026-08', name: 'Rent', kind: 'EXPENSE', icon: 'home', color: 'blue', dailySpend: false, isActive: true },
    ],
    budgets: [
      { id: 'food-budget', month: '2026-07', categoryId: 'food', budgetType: 'EXPENSE_LIMIT', plannedAmount: 100 },
      { id: 'rent-budget', month: '2026-08', categoryId: 'rent', budgetType: 'EXPENSE_LIMIT', plannedAmount: 200 },
    ],
    incomePlans: [
      { id: 'salary', month: '2026-07', sourceName: 'Salary', memberId: 'thang', expectedAmount: 300 },
    ],
  } as AppState;
}

describe('plan month helpers', () => {
  it('filters each plan collection and detects any plan data for a month', () => {
    const state = makeState();

    expect(filterCategories(state, '2026-07')).toHaveLength(1);
    expect(filterBudgets(state, '2026-07')).toHaveLength(1);
    expect(filterIncomePlans(state, '2026-07')).toHaveLength(1);
    expect(monthHasPlanData(state, '2026-07')).toBe(true);
    expect(monthHasPlanData(state, '2026-09')).toBe(false);
  });

  it('auto-copies the previous month only when the target is empty', () => {
    const state = makeState();
    const result = ensurePlanMonth(state, '2026-08');

    expect(result.didAutoCopy).toBe(false);
    expect(result.state).toBe(state);

    const emptyTarget = {
      ...state,
      categories: filterCategories(state, '2026-07'),
      budgets: filterBudgets(state, '2026-07'),
      incomePlans: filterIncomePlans(state, '2026-07'),
    };
    const copied = ensurePlanMonth(emptyTarget, '2026-08');
    expect(copied.didAutoCopy).toBe(true);
    expect(filterCategories(copied.state, '2026-08')[0]).toMatchObject({ id: 'food', month: '2026-08' });
  });

  it('does not overwrite an existing target month unless requested', () => {
    const state = makeState();

    expect(copyPlanMonth(state, '2026-07', '2026-08', { overwrite: false })).toBe(state);
  });

  it('overwrites the target and copies source plans with the same ids', () => {
    const state = makeState();
    const copied = copyPlanMonth(state, '2026-07', '2026-08', { overwrite: true });

    expect(copied).not.toBe(state);
    expect(filterCategories(copied, '2026-08')).toEqual([
      expect.objectContaining({ id: 'food', month: '2026-08' }),
    ]);
    expect(filterBudgets(copied, '2026-08')).toEqual([
      expect.objectContaining({ id: 'food-budget', month: '2026-08' }),
    ]);
    expect(filterIncomePlans(copied, '2026-08')).toEqual([
      expect.objectContaining({ id: 'salary', month: '2026-08' }),
    ]);
    expect(state.categories.find((category) => category.id === 'food')?.month).toBe('2026-07');
    expect(filterCategories(copied, '2026-08').find((category) => category.id === 'food')?.month).toBe('2026-08');
  });
});
