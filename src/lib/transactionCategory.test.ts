import { describe, expect, it } from 'vitest';
import * as transactionCategory from './ledger';

describe('transactionCategoryId', () => {
  it('removes a stale category from internal transfers', () => {
    const normalize = (
      transactionCategory as typeof transactionCategory & {
        transactionCategoryId?: (
          transactionType: string,
          categoryId?: string
        ) => string | undefined;
      }
    ).transactionCategoryId;

    expect(normalize?.('TRANSFER', 'cat_bao_hiem')).toBeUndefined();
  });

  it('keeps the category for expenses', () => {
    const normalize = (
      transactionCategory as typeof transactionCategory & {
        transactionCategoryId?: (
          transactionType: string,
          categoryId?: string
        ) => string | undefined;
      }
    ).transactionCategoryId;

    expect(normalize?.('EXPENSE', 'cat_bao_hiem')).toBe('cat_bao_hiem');
  });
});
