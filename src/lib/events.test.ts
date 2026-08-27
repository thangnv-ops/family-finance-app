import { describe, expect, it } from 'vitest';
import * as ledger from './ledger';
import type { Category, EventBudget, Transaction } from '../types/finance';

const event: EventBudget = {
  id: 'event_1',
  name: 'Về quê',
  eventType: 'FAMILY',
  startDate: '2026-08-10',
  endDate: '2026-08-12',
  expectedIncome: 2_000_000,
  budgetAmount: 8_000_000,
  status: 'PLANNING',
};

const category: Category = {
  id: 'food',
  name: 'Ăn uống',
  kind: 'EXPENSE',
  icon: 'Coffee',
  color: '#000',
  dailySpend: true,
  isActive: true,
};

function transaction(
  id: string,
  transactionDate: string,
  transactionType: Transaction['transactionType'],
  amount: number
): Transaction {
  return {
    id,
    transactionDate,
    transactionType,
    amount,
    currency: 'VND',
    description: id,
    categoryId: 'food',
    memberId: 'thang',
    createdAt: `${transactionDate}T00:00:00.000Z`,
    updatedAt: `${transactionDate}T00:00:00.000Z`,
  };
}

describe('event cash flow', () => {
  it('adds active event plans once in their starting month', () => {
    const summarizeEventPlansForMonth = (ledger as any).summarizeEventPlansForMonth;
    expect(summarizeEventPlansForMonth).toBeTypeOf('function');

    expect(
      summarizeEventPlansForMonth(
        [
          event,
          { ...event, id: 'next', startDate: '2026-09-01', endDate: '2026-09-02' },
          { ...event, id: 'cancelled', status: 'CANCELLED' },
        ],
        '2026-08'
      )
    ).toEqual({ income: 2_000_000, expense: 8_000_000 });

    expect(
      summarizeEventPlansForMonth(
        [
          { ...event, endDate: '2026-09-02' },
          { ...event, id: 'next', startDate: '2026-09-01', endDate: '2026-09-02' },
        ],
        '2026-09'
      )
    ).toEqual({ income: 2_000_000, expense: 8_000_000 });
  });

  it('summarizes actual income and expense inside the inclusive event dates', () => {
    const summarizeEventTransactions = (ledger as any).summarizeEventTransactions;
    expect(summarizeEventTransactions).toBeTypeOf('function');

    expect(
      summarizeEventTransactions(event, [
        transaction('before', '2026-08-09', 'EXPENSE', 900_000),
        transaction('start', '2026-08-10', 'EXPENSE', 300_000),
        transaction('income', '2026-08-11', 'INCOME', 500_000),
        transaction('end', '2026-08-12', 'CREDIT_PURCHASE', 200_000),
        transaction('after', '2026-08-13', 'EXPENSE', 700_000),
      ])
    ).toEqual({ income: 500_000, expense: 500_000, transactionsCount: 3 });
  });

  it('excludes daily spending inside an event from the daily advisor', () => {
    const result = ledger.calculateDailyAdvisor(
      [
        transaction('event-spend', '2026-08-11', 'EXPENSE', 500_000),
        transaction('normal-spend', '2026-08-13', 'EXPENSE', 200_000),
      ],
      [category],
      [{ id: 'budget', month: '2026-08', categoryId: 'food', budgetType: 'EXPENSE_LIMIT', plannedAmount: 1_000_000 }],
      '2026-08',
      [event]
    );

    expect(result.mtdDailySpend).toBe(200_000);
  });
});
