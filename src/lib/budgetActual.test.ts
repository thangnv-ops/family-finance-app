import { describe, expect, it } from 'vitest';
import * as ledger from './ledger';

describe('budget actual amount', () => {
  it('uses current credit debt for the credit repayment category', () => {
    const budgetActualAmount = (ledger as any).budgetActualAmount;
    expect(budgetActualAmount).toBeTypeOf('function');
    expect(budgetActualAmount('cat_tra_tin_dung', 0, 6_500_000)).toBe(6_500_000);
  });

  it('keeps monthly category spending for other categories', () => {
    const budgetActualAmount = (ledger as any).budgetActualAmount;
    expect(budgetActualAmount).toBeTypeOf('function');
    expect(budgetActualAmount('cat_an_ngoai', 850_000, 6_500_000)).toBe(850_000);
  });
});
