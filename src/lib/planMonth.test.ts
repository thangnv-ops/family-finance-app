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
      { id: 'food', name: 'Food', kind: 'EXPENSE', icon: 'food', color: 'red', dailySpend: true, isActive: true },
      { id: 'rent', name: 'Rent', kind: 'EXPENSE', icon: 'home', color: 'blue', dailySpend: false, isActive: true },
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
  it('filters budgets/income by month; categories are shared', () => {
    const state = makeState();

    expect(filterCategories(state, '2026-07')).toHaveLength(2);
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
      budgets: filterBudgets(state, '2026-07'),
      incomePlans: filterIncomePlans(state, '2026-07'),
    };
    const copied = ensurePlanMonth(emptyTarget, '2026-08');
    expect(copied.didAutoCopy).toBe(true);
    expect(filterBudgets(copied.state, '2026-08')).toEqual([
      expect.objectContaining({ id: 'food-budget', month: '2026-08' }),
    ]);
    expect(copied.state.categories).toEqual(state.categories);
  });

  it('does not overwrite an existing target month unless requested', () => {
    const state = makeState();

    expect(copyPlanMonth(state, '2026-07', '2026-08', { overwrite: false })).toBe(state);
  });

  it('overwrites the target and copies source plans with the same ids', () => {
    const state = makeState();
    const copied = copyPlanMonth(state, '2026-07', '2026-08', { overwrite: true });

    expect(copied).not.toBe(state);
    expect(copied.categories).toEqual(state.categories);
    expect(filterBudgets(copied, '2026-08')).toEqual([
      expect.objectContaining({ id: 'food-budget', month: '2026-08' }),
    ]);
    expect(filterIncomePlans(copied, '2026-08')).toEqual([
      expect.objectContaining({ id: 'salary', month: '2026-08' }),
    ]);
  });
});
