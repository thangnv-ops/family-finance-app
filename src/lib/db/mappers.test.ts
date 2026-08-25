import { describe, it, expect } from 'vitest';
import { transactionToRow, rowToTransaction } from './mappers';

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
