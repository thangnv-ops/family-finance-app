import { describe, expect, it } from 'vitest';
import * as ledger from './ledger';
import type { Transaction } from '../types/finance';

function transaction(
  id: string,
  date: string,
  transactionType: Transaction['transactionType'],
  amount: number
): Transaction {
  return {
    id,
    transactionDate: date,
    transactionType,
    amount,
    currency: 'VND',
    description: id,
    memberId: 'thang',
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe('budget actual amount', () => {
  it('uses credit payments for the credit repayment category', () => {
    const budgetActualAmount = (ledger as any).budgetActualAmount;
    expect(budgetActualAmount).toBeTypeOf('function');
    expect(budgetActualAmount('cat_tra_tin_dung', 0, 2_500_000)).toBe(2_500_000);
  });

  it('keeps monthly category spending for other categories', () => {
    const budgetActualAmount = (ledger as any).budgetActualAmount;
    expect(budgetActualAmount).toBeTypeOf('function');
    expect(budgetActualAmount('cat_an_ngoai', 850_000, 2_500_000)).toBe(850_000);
  });

  it('totals only credit payments in the selected month', () => {
    const calculateCreditPayments = (ledger as any).calculateCreditPayments;
    expect(calculateCreditPayments).toBeTypeOf('function');
    expect(
      calculateCreditPayments('2026-08', [
        transaction('purchase', '2026-08-01', 'CREDIT_PURCHASE', 900_000),
        transaction('payment-1', '2026-08-10', 'CREDIT_PAYMENT', 1_000_000),
        transaction('payment-2', '2026-08-20', 'CREDIT_PAYMENT', 500_000),
        transaction('other-month', '2026-07-31', 'CREDIT_PAYMENT', 700_000),
        { ...transaction('deleted', '2026-08-21', 'CREDIT_PAYMENT', 800_000), deletedAt: '2026-08-22T00:00:00.000Z' },
      ])
    ).toBe(1_500_000);
  });
});
