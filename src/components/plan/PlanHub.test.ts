// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyAppState } from '../../lib/emptyState';
import { getCurrentMonthStr, shiftMonth } from '../../lib/formatters';
import { PlanHub } from './PlanHub';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('PlanHub', () => {
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    container?.remove();
    container = undefined;
  });

  it('renders the next month when it contains an expense budget', async () => {
    const nextMonth = shiftMonth(getCurrentMonthStr(), 1);
    const state = createEmptyAppState('Test');
    state.categories = [
      {
        id: 'food',
        name: 'Ăn uống',
        kind: 'EXPENSE',
        icon: 'Coffee',
        color: '#000000',
        dailySpend: true,
        isActive: true,
      },
    ];
    state.budgets = [
      {
        id: 'food-budget',
        month: nextMonth,
        categoryId: 'food',
        budgetType: 'EXPENSE_LIMIT',
        plannedAmount: 5_000_000,
      },
    ];
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const noop = () => undefined;

    await act(async () => {
      root.render(
        React.createElement(PlanHub, {
          appState: state,
          budgets: state.budgets,
          incomePlans: [],
          categories: state.categories,
          transactions: [],
          creditPaymentDue: null,
          plannedExpenses: [],
          goals: [],
          events: [],
          members: [],
          accounts: [],
          onUpdateBudget: noop,
          onAddPlannedExpense: noop,
          onUpdatePlannedExpense: noop,
          onAddGoal: noop,
          onUpdateGoal: noop,
          onAddEvent: noop,
          onUpdateEvent: noop,
          onDeleteEvent: noop,
          onApplyPlanState: noop,
        })
      );
    });

    const nextButton = container.querySelector('button[aria-label="Tháng sau"]') as HTMLButtonElement;
    await act(async () => nextButton.click());

    expect(container.textContent).toContain('5.000.000');

    await act(async () => root.unmount());
  });
});
