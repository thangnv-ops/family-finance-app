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
