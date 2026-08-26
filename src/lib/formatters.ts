/**
 * Formatting utilities for Vietnamese Currency, Numbers, and Dates
 */

export function formatVND(amount: number, options?: { compact?: boolean; showSign?: boolean }): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (options?.compact) {
    if (absAmount >= 1_000_000_000) {
      formatted = `${(absAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} Tỷ`;
    } else if (absAmount >= 1_000_000) {
      formatted = `${(absAmount / 1_000_000).toFixed(1).replace(/\.0$/, '')} Tr`;
    } else if (absAmount >= 1_000) {
      formatted = `${(absAmount / 1_000).toFixed(0)} K`;
    } else {
      formatted = absAmount.toLocaleString('vi-VN');
    }
  } else {
    formatted = absAmount.toLocaleString('vi-VN') + ' ₫';
  }

  if (isNegative) {
    return `-${formatted}`;
  }
  if (options?.showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatMonthVN(monthStr: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length >= 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}

export function shiftMonth(ym: string, deltaMonths: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getRemainingDaysInMonth(yearMonth?: string): number {
  const now = new Date();
  const currentYM = getCurrentMonthStr();
  const targetYM = yearMonth || currentYM;

  if (targetYM !== currentYM) {
    return getDaysInMonth(targetYM);
  }
  const totalDays = getDaysInMonth(currentYM);
  const currentDay = now.getDate();
  return Math.max(1, totalDays - currentDay + 1);
}
