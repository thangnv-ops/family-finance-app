import type { Budget, Category, IncomePlan } from '../types/finance';
import type { AppState } from './storage';
import { shiftMonth } from './formatters';

/** Categories are household-scoped (not per-month). */
export function filterCategories(state: AppState, _month?: string): Category[] {
  return state.categories;
}

export function filterBudgets(state: AppState, month: string): Budget[] {
  return state.budgets.filter((budget) => budget.month === month);
}

export function filterIncomePlans(state: AppState, month: string): IncomePlan[] {
  return state.incomePlans.filter((incomePlan) => incomePlan.month === month);
}

export function monthHasPlanData(state: AppState, month: string): boolean {
  return filterBudgets(state, month).length > 0 || filterIncomePlans(state, month).length > 0;
}

/** Copy budgets + income plans only; category directory is shared across months. */
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
