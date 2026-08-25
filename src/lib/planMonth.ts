import type { Budget, Category, IncomePlan } from '../types/finance';
import type { AppState } from './storage';
import { shiftMonth } from './formatters';

export function filterCategories(state: AppState, month: string): Category[] {
  return state.categories.filter((category) => category.month === month);
}

export function filterBudgets(state: AppState, month: string): Budget[] {
  return state.budgets.filter((budget) => budget.month === month);
}

export function filterIncomePlans(state: AppState, month: string): IncomePlan[] {
  return state.incomePlans.filter((incomePlan) => incomePlan.month === month);
}

export function monthHasPlanData(state: AppState, month: string): boolean {
  return (
    filterCategories(state, month).length > 0 ||
    filterBudgets(state, month).length > 0 ||
    filterIncomePlans(state, month).length > 0
  );
}

export function copyPlanMonth(
  state: AppState,
  fromMonth: string,
  toMonth: string,
  options: { overwrite: boolean },
): AppState {
  if (!options.overwrite && monthHasPlanData(state, toMonth)) {
    return state;
  }

  return {
    ...state,
    categories: [
      ...state.categories.filter((category) => category.month !== toMonth),
      ...filterCategories(state, fromMonth).map((category) => ({ ...category, month: toMonth })),
    ],
    budgets: [
      ...state.budgets.filter((budget) => budget.month !== toMonth),
      ...filterBudgets(state, fromMonth).map((budget) => ({ ...budget, month: toMonth })),
    ],
    incomePlans: [
      ...state.incomePlans.filter((incomePlan) => incomePlan.month !== toMonth),
      ...filterIncomePlans(state, fromMonth).map((incomePlan) => ({ ...incomePlan, month: toMonth })),
    ],
  };
}

export function ensurePlanMonth(
  state: AppState,
  month: string,
): { state: AppState; didAutoCopy: boolean } {
  if (monthHasPlanData(state, month)) {
    return { state, didAutoCopy: false };
  }

  const sourceMonth = shiftMonth(month, -1);
  if (!monthHasPlanData(state, sourceMonth)) {
    return { state, didAutoCopy: false };
  }

  return {
    state: copyPlanMonth(state, sourceMonth, month, { overwrite: false }),
    didAutoCopy: true,
  };
}
