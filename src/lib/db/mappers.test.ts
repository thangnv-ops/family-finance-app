import { describe, it, expect } from 'vitest';
import {
  categoryToRow,
  rowToCategory,
  transactionToRow,
  rowToTransaction,
  eventToRow,
  rowToEvent,
} from './mappers';

describe('transaction mappers', () => {
  it('round-trips a transaction', () => {
    const tx = {
      id: 'tx_1',
      transactionDate: '2026-08-01',
      transactionType: 'EXPENSE' as const,
      amount: 1000,
      currency: 'VND' as const,
      description: 'Cafe',
      memberId: 'thang',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    };
    const row = transactionToRow('11111111-1111-1111-1111-111111111111', tx);
    expect(row.household_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(row.amount).toBe(1000);
    expect(rowToTransaction(row).description).toBe('Cafe');
  });
});

describe('event mappers', () => {
  it('round-trips planned income and expense totals', () => {
    const event = {
      id: 'event_1',
      name: 'Về quê',
      eventType: 'FAMILY' as const,
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      expectedIncome: 2_000_000,
      budgetAmount: 8_000_000,
      status: 'PLANNING' as const,
    };

    const row = eventToRow('11111111-1111-1111-1111-111111111111', event);
    expect(row.expected_income).toBe(2_000_000);
    expect(rowToEvent(row)).toEqual(event);
  });
});

describe('category mappers', () => {
  it('round-trips a household-scoped category without month', () => {
    const category = {
      id: 'cat_food',
      name: 'Food',
      kind: 'EXPENSE' as const,
      icon: 'Utensils',
      color: '#22c55e',
      dailySpend: true,
      ownerScope: 'ALL' as const,
      isActive: true,
    };
    const row = categoryToRow('11111111-1111-1111-1111-111111111111', category);
    expect(row).not.toHaveProperty('month');
    expect(rowToCategory(row).id).toBe('cat_food');
    expect(rowToCategory(row).name).toBe('Food');
  });
});
