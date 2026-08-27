import { describe, expect, it } from 'vitest';
import * as creditCard from './creditCard';
import { CreditCardStatement, Transaction } from '../types/finance';

const { validateCreditCardDays } = creditCard;

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

describe('getPayableCreditStatement', () => {
  const statements: CreditCardStatement[] = [
    {
      id: 'paid-old',
      periodStart: '2026-06-21',
      periodEnd: '2026-07-20',
      statementDate: '2026-07-20',
      dueDate: '2026-08-05',
      calculatedAmount: 2_000_000,
      paidAmount: 2_000_000,
      status: 'PAID',
    },
    {
      id: 'latest-unpaid',
      periodStart: '2026-07-21',
      periodEnd: '2026-08-20',
      statementDate: '2026-08-20',
      dueDate: '2026-09-05',
      calculatedAmount: 1_200_000,
      actualStatementAmount: 1_000_000,
      paidAmount: 200_000,
      status: 'PARTIALLY_PAID',
    },
  ];

  it('returns only the remaining amount from the latest unpaid statement', () => {
    const getPayable = (
      creditCard as typeof creditCard & {
        getPayableCreditStatement?: (
          input: CreditCardStatement[],
          today: Date
        ) => { statementId: string; amount: number; dueDate: string; daysUntilDue: number } | null;
      }
    ).getPayableCreditStatement;

    expect(getPayable?.(statements, new Date('2026-08-27T12:00:00+07:00'))).toEqual({
      statementId: 'latest-unpaid',
      amount: 800_000,
      dueDate: '2026-09-05',
      daysUntilDue: 9,
    });
  });

  it('reports a negative day count when the statement is overdue', () => {
    const getPayable = (
      creditCard as typeof creditCard & {
        getPayableCreditStatement?: (
          input: CreditCardStatement[],
          today: Date
        ) => { statementId: string; amount: number; daysUntilDue: number } | null;
      }
    ).getPayableCreditStatement;

    expect(getPayable?.(statements, new Date('2026-09-07T12:00:00+07:00'))?.daysUntilDue).toBe(-2);
  });
});

describe('getCreditPaymentDue', () => {
  it('excludes purchases after the latest statement cutoff', () => {
    const transactions: Transaction[] = [
      {
        id: 'before-cutoff',
        transactionDate: '2026-08-20',
        transactionType: 'CREDIT_PURCHASE',
        amount: 100_000,
        currency: 'VND',
        description: 'Trước ngày chốt',
        sourceAccountId: 'tin_dung',
        memberId: 'thang',
        createdAt: '2026-08-20T00:00:00.000Z',
        updatedAt: '2026-08-20T00:00:00.000Z',
      },
      {
        id: 'after-cutoff',
        transactionDate: '2026-08-26',
        transactionType: 'CREDIT_PURCHASE',
        amount: 200_000,
        currency: 'VND',
        description: 'Sau ngày chốt',
        sourceAccountId: 'tin_dung',
        memberId: 'thang',
        createdAt: '2026-08-26T00:00:00.000Z',
        updatedAt: '2026-08-26T00:00:00.000Z',
      },
      {
        id: 'payment-after-cutoff',
        transactionDate: '2026-08-27',
        transactionType: 'CREDIT_PAYMENT',
        amount: 20_000,
        currency: 'VND',
        description: 'Đã trả một phần',
        sourceAccountId: 'tk_thang',
        destinationAccountId: 'tin_dung',
        memberId: 'thang',
        createdAt: '2026-08-27T00:00:00.000Z',
        updatedAt: '2026-08-27T00:00:00.000Z',
      },
    ];
    const getDue = (
      creditCard as typeof creditCard & {
        getCreditPaymentDue?: (input: {
          statements: CreditCardStatement[];
          transactions: Transaction[];
          openingBalance: number;
          statementDay: number;
          dueDay: number;
          today: Date;
        }) => { statementId?: string; amount: number; dueDate: string; daysUntilDue: number } | null;
      }
    ).getCreditPaymentDue;

    expect(
      getDue?.({
        statements: [],
        transactions,
        openingBalance: 0,
        statementDay: 25,
        dueDay: 5,
        today: new Date('2026-08-27T12:00:00+07:00'),
      })
    ).toEqual({ amount: 80_000, dueDate: '2026-09-05', daysUntilDue: 9 });
  });
});
