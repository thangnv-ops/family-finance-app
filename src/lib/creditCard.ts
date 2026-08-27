import { CreditCardStatement, Transaction } from '../types/finance';

export function validateCreditCardDays(statementDay: number, dueDay: number): string | null {
  if (
    !Number.isInteger(statementDay) ||
    !Number.isInteger(dueDay) ||
    statementDay < 1 ||
    statementDay > 31 ||
    dueDay < 1 ||
    dueDay > 31
  ) {
    return 'Ngày chốt sao kê và hạn thanh toán phải là số nguyên từ 1 đến 31.';
  }
  return null;
}

export function getPayableCreditStatement(
  statements: CreditCardStatement[],
  today = new Date()
): { statementId: string; amount: number; dueDate: string; daysUntilDue: number } | null {
  const statement = [...statements]
    .sort((a, b) => b.statementDate.localeCompare(a.statementDate))
    .find((item) => {
      const amount = item.actualStatementAmount ?? item.calculatedAmount;
      return item.status !== 'PAID' && amount > item.paidAmount;
    });

  if (!statement) return null;

  const [year, month, day] = statement.dueDate.split('-').map(Number);
  const dueUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return {
    statementId: statement.id,
    amount: (statement.actualStatementAmount ?? statement.calculatedAmount) - statement.paidAmount,
    dueDate: statement.dueDate,
    daysUntilDue: Math.round((dueUtc - todayUtc) / 86_400_000),
  };
}

export function getCreditPaymentDue({
  statements,
  transactions,
  openingBalance,
  statementDay,
  dueDay,
  today = new Date(),
}: {
  statements: CreditCardStatement[];
  transactions: Transaction[];
  openingBalance: number;
  statementDay: number;
  dueDay: number;
  today?: Date;
}): { statementId?: string; amount: number; dueDate: string; daysUntilDue: number } | null {
  const savedStatement = getPayableCreditStatement(statements, today);
  if (savedStatement) return savedStatement;

  const cutoffMonth = today.getDate() >= statementDay ? today.getMonth() : today.getMonth() - 1;
  const cutoffYear = today.getFullYear();
  const cutoffDay = Math.min(
    statementDay,
    new Date(cutoffYear, cutoffMonth + 1, 0).getDate()
  );
  const cutoff = new Date(cutoffYear, cutoffMonth, cutoffDay);
  const cutoffDate = [
    cutoff.getFullYear(),
    String(cutoff.getMonth() + 1).padStart(2, '0'),
    String(cutoff.getDate()).padStart(2, '0'),
  ].join('-');
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  let amount = openingBalance;
  for (const transaction of transactions) {
    if (transaction.deletedAt || transaction.transactionDate > todayDate) continue;
    if (transaction.transactionType === 'CREDIT_PURCHASE' && transaction.transactionDate <= cutoffDate) {
      amount += transaction.amount;
    } else if (transaction.transactionType === 'CREDIT_REFUND' && transaction.transactionDate <= cutoffDate) {
      amount -= transaction.amount;
    } else if (transaction.transactionType === 'CREDIT_PAYMENT') {
      amount -= transaction.amount;
    }
  }

  amount = Math.max(0, amount);
  if (amount === 0) return null;

  const dueMonth = cutoff.getMonth() + 1;
  const dueYear = cutoff.getFullYear();
  const actualDueDay = Math.min(dueDay, new Date(dueYear, dueMonth + 1, 0).getDate());
  const dueUtc = Date.UTC(dueYear, dueMonth, actualDueDay);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = [
    new Date(dueUtc).getUTCFullYear(),
    String(new Date(dueUtc).getUTCMonth() + 1).padStart(2, '0'),
    String(new Date(dueUtc).getUTCDate()).padStart(2, '0'),
  ].join('-');

  return {
    amount,
    dueDate,
    daysUntilDue: Math.round((dueUtc - todayUtc) / 86_400_000),
  };
}
