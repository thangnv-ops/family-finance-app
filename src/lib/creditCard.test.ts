import { describe, expect, it } from 'vitest';
import { validateCreditCardDays } from './creditCard';

describe('validateCreditCardDays', () => {
  it('accepts statement and due days within a calendar month', () => {
    expect(validateCreditCardDays(1, 31)).toBeNull();
  });

  it.each([
    [0, 5],
    [20, 32],
    [1.5, 5],
  ])('rejects invalid statement day %s or due day %s', (statementDay, dueDay) => {
    expect(validateCreditCardDays(statementDay, dueDay)).toBe(
      'Ngày chốt sao kê và hạn thanh toán phải là số nguyên từ 1 đến 31.'
    );
  });
});
