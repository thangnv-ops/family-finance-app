/**
 * Pure Financial Ledger and Calculation Engine
 * Adheres strictly to the Family Finance App Specification v3
 */

import {
  Transaction,
  FinancialAccount,
  SavingsDeposit,
  Loan,
  Goal,
  Budget,
  Category,
  CreditCardConfig,
} from '../types/finance';
import { getCurrentMonthStr, getDaysInMonth } from './formatters';
import { reservedGoalAmount } from './goals';

export interface AccountBalances {
  tk_thang: number;
  tk_van: number;
  tin_dung: number; // Liability amount (positive number represents debt)
  totalCash: number; // tk_thang + tk_van
  availableCash: number; // totalCash - reservedGoals
  reservedGoals: number;
  totalSavings: number;
  totalReceivables: number; // Cho vay
  totalPayables: number; // Đi vay
  netWorth: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  netIncome: number; // income - expense
  cashIn: number;
  cashOut: number;
  netCashFlow: number; // cashIn - cashOut
  savingsNet: number; // deposits - withdraws
  dailySpendActual: number;
  dailySpendBudget: number;
  totalTransactionsCount: number;
  byMember: {
    thang: { income: number; expense: number; cashSpent: number };
    van: { income: number; expense: number; cashSpent: number };
  };
}

export interface DailyAdvisorData {
  dailySpendBudget: number;
  mtdDailySpend: number;
  remainingDailyBudget: number;
  remainingDays: number;
  recommendedToday: number;
  pace7Days: number;
  pace14Days: number;
  projectedMonthEnd: number;
  projectedVariance: number; // projected - budget (>0 is over budget)
  status: 'SAFE' | 'WARNING' | 'DANGER';
}

/**
 * Calculates current real-time ledger balances across all accounts
 */
export function calculateBalances(
  accounts: FinancialAccount[],
  transactions: Transaction[],
  savings: SavingsDeposit[],
  loans: Loan[],
  goals: Goal[]
): AccountBalances {
  const activeTx = transactions.filter((t) => !t.deletedAt);

  const thangAccount = accounts.find((a) => a.id === 'tk_thang');
  const vanAccount = accounts.find((a) => a.id === 'tk_van');
  const tinDungAccount = accounts.find((a) => a.id === 'tin_dung');

  let balThang = thangAccount?.openingBalance || 0;
  let balVan = vanAccount?.openingBalance || 0;
  let balTinDung = tinDungAccount?.openingBalance || 0;

  for (const tx of activeTx) {
    const amt = tx.amount;
    const src = tx.sourceAccountId;
    const dest = tx.destinationAccountId;

    switch (tx.transactionType) {
      case 'EXPENSE':
        if (src === 'tk_thang') balThang -= amt;
        else if (src === 'tk_van') balVan -= amt;
        break;

      case 'INCOME':
        if (dest === 'tk_thang' || (!dest && tx.memberId === 'thang')) balThang += amt;
        else if (dest === 'tk_van' || (!dest && tx.memberId === 'van')) balVan += amt;
        break;

      case 'TRANSFER':
        if (src === 'tk_thang' && dest === 'tk_van') {
          balThang -= amt;
          balVan += amt;
        } else if (src === 'tk_van' && dest === 'tk_thang') {
          balVan -= amt;
          balThang += amt;
        }
        break;

      case 'CREDIT_PURCHASE':
        balTinDung += amt; // Debt increases
        break;

      case 'CREDIT_PAYMENT':
        if (src === 'tk_thang') balThang -= amt;
        else if (src === 'tk_van') balVan -= amt;
        balTinDung -= amt; // Debt decreases
        break;

      case 'CREDIT_REFUND':
        balTinDung -= amt; // Debt reversed
        break;

      case 'REFUND':
        if (dest === 'tk_thang' || src === 'tk_thang') balThang += amt;
        else if (dest === 'tk_van' || src === 'tk_van') balVan += amt;
        break;

      case 'LEND':
        if (src === 'tk_thang') balThang -= amt;
        else if (src === 'tk_van') balVan -= amt;
        break;

      case 'COLLECT_LOAN':
        if (dest === 'tk_thang' || (!dest && tx.memberId === 'thang')) balThang += amt;
        else if (dest === 'tk_van' || (!dest && tx.memberId === 'van')) balVan += amt;
        break;

      case 'BORROW':
        if (dest === 'tk_thang' || (!dest && tx.memberId === 'thang')) balThang += amt;
        else if (dest === 'tk_van' || (!dest && tx.memberId === 'van')) balVan += amt;
        break;

      case 'REPAY_LOAN':
        if (src === 'tk_thang') balThang -= amt;
        else if (src === 'tk_van') balVan -= amt;
        break;

      case 'SAVINGS_DEPOSIT':
        if (src === 'tk_thang') balThang -= amt;
        else if (src === 'tk_van') balVan -= amt;
        break;

      case 'SAVINGS_WITHDRAW':
        if (dest === 'tk_thang' || (!dest && tx.memberId === 'thang')) balThang += amt;
        else if (dest === 'tk_van' || (!dest && tx.memberId === 'van')) balVan += amt;
        break;

      case 'BALANCE_ADJUSTMENT':
        if (src === 'tk_thang' || dest === 'tk_thang') balThang += amt;
        else if (src === 'tk_van' || dest === 'tk_van') balVan += amt;
        else if (src === 'tin_dung' || dest === 'tin_dung') balTinDung += amt;
        break;
    }
  }

  const totalCash = balThang + balVan;

  // Active savings assets
  const totalSavings = savings
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.principal, 0);

  // Active receivables (cho vay)
  const totalReceivables = loans
    .filter((l) => l.direction === 'RECEIVABLE' && (l.status === 'ACTIVE' || l.status === 'PARTIALLY_PAID'))
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  // Active payables (đi vay)
  const totalPayables = loans
    .filter((l) => l.direction === 'PAYABLE' && (l.status === 'ACTIVE' || l.status === 'PARTIALLY_PAID'))
    .reduce((sum, l) => sum + l.outstandingPrincipal, 0);

  const reservedGoals = reservedGoalAmount(goals);

  const availableCash = totalCash - reservedGoals;

  // Net Worth formula (Section 34):
  // Net Worth = TK Thắng + TK Vân + Savings + Receivables - Tín dụng - Payables
  const netWorth = totalCash + totalSavings + totalReceivables - balTinDung - totalPayables;

  return {
    tk_thang: balThang,
    tk_van: balVan,
    tin_dung: balTinDung,
    totalCash,
    availableCash,
    reservedGoals,
    totalSavings,
    totalReceivables,
    totalPayables,
    netWorth,
  };
}

/**
 * Calculates monthly statistics for a given month (YYYY-MM)
 */
export function calculateMonthlyStats(
  month: string,
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): MonthlyStats {
  const activeTx = transactions.filter((t) => !t.deletedAt && t.transactionDate.startsWith(month));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  let income = 0;
  let expense = 0;
  let cashIn = 0;
  let cashOut = 0;
  let savingsNet = 0;
  let dailySpendActual = 0;

  const byMember = {
    thang: { income: 0, expense: 0, cashSpent: 0 },
    van: { income: 0, expense: 0, cashSpent: 0 },
  };

  for (const tx of activeTx) {
    const amt = tx.amount;
    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
    const isDaily = cat?.dailySpend ?? false;
    const memKey = tx.memberId === 'van' ? 'van' : 'thang';

    switch (tx.transactionType) {
      case 'INCOME':
        income += amt;
        cashIn += amt;
        byMember[memKey].income += amt;
        break;

      case 'EXPENSE':
        expense += amt;
        cashOut += amt;
        byMember[memKey].expense += amt;
        byMember[memKey].cashSpent += amt;
        if (isDaily) dailySpendActual += amt;
        break;

      case 'CREDIT_PURCHASE':
        expense += amt;
        // Credit purchase does not reduce cash immediately
        byMember[memKey].expense += amt;
        if (isDaily) dailySpendActual += amt;
        break;

      case 'CREDIT_PAYMENT':
        // Payment of credit bill is Cash Out, but NOT double-counted as expense
        cashOut += amt;
        byMember[memKey].cashSpent += amt;
        break;

      case 'CREDIT_REFUND':
        expense -= amt;
        break;

      case 'REFUND':
        expense -= amt;
        cashIn += amt;
        break;

      case 'LEND':
        cashOut += amt;
        break;

      case 'COLLECT_LOAN':
        cashIn += amt;
        break;

      case 'BORROW':
        cashIn += amt;
        break;

      case 'REPAY_LOAN':
        cashOut += amt;
        break;

      case 'SAVINGS_DEPOSIT':
        cashOut += amt;
        savingsNet += amt;
        break;

      case 'SAVINGS_WITHDRAW':
        cashIn += amt;
        savingsNet -= amt;
        break;
    }
  }

  // Daily spend budget for month
  const dailyCatIds = new Set(categories.filter((c) => c.dailySpend).map((c) => c.id));
  const dailySpendBudget = budgets
    .filter((b) => b.month === month && dailyCatIds.has(b.categoryId) && b.budgetType === 'EXPENSE_LIMIT')
    .reduce((sum, b) => sum + b.plannedAmount, 0);

  return {
    month,
    income,
    expense,
    netIncome: income - expense,
    cashIn,
    cashOut,
    netCashFlow: cashIn - cashOut,
    savingsNet,
    dailySpendActual,
    dailySpendBudget,
    totalTransactionsCount: activeTx.length,
    byMember,
  };
}

/**
 * Calculates Daily Spending Advisor metrics (Section 12)
 */
export function calculateDailyAdvisor(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  targetMonth?: string
): DailyAdvisorData {
  const currentYM = targetMonth || getCurrentMonthStr();
  const today = new Date();
  const currentDay = today.getDate();
  const totalDays = getDaysInMonth(currentYM);
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  const monthStats = calculateMonthlyStats(currentYM, transactions, categories, budgets);
  const dailyBudget = monthStats.dailySpendBudget || 15_000_000; // Default sensible 15M VND if not set
  const mtdSpend = monthStats.dailySpendActual;

  const remainingDailyBudget = Math.max(0, dailyBudget - mtdSpend);
  const recommendedToday = Math.round(remainingDailyBudget / remainingDays);

  // Calculate 7-day average pace
  const activeTx = transactions.filter((t) => !t.deletedAt && t.transactionDate.startsWith(currentYM));
  const dailyCatIds = new Set(categories.filter((c) => c.dailySpend).map((c) => c.id));

  const dayMap: Record<number, number> = {};
  for (let i = 1; i <= currentDay; i++) {
    dayMap[i] = 0;
  }

  for (const tx of activeTx) {
    if (
      (tx.transactionType === 'EXPENSE' || tx.transactionType === 'CREDIT_PURCHASE') &&
      tx.categoryId &&
      dailyCatIds.has(tx.categoryId)
    ) {
      const txDay = parseInt(tx.transactionDate.split('-')[2], 10);
      if (txDay && txDay <= currentDay) {
        dayMap[txDay] = (dayMap[txDay] || 0) + tx.amount;
      }
    }
  }

  const daysPassed = Math.max(1, currentDay);
  const days7Count = Math.min(7, daysPassed);
  let sum7 = 0;
  for (let d = currentDay; d > currentDay - days7Count; d--) {
    sum7 += dayMap[d] || 0;
  }
  const pace7Days = Math.round(sum7 / days7Count);

  const days14Count = Math.min(14, daysPassed);
  let sum14 = 0;
  for (let d = currentDay; d > currentDay - days14Count; d--) {
    sum14 += dayMap[d] || 0;
  }
  const pace14Days = Math.round(sum14 / days14Count);

  const effectivePace = pace7Days > 0 ? pace7Days : (mtdSpend / daysPassed);
  const projectedMonthEnd = Math.round(mtdSpend + effectivePace * (remainingDays - 1));
  const projectedVariance = projectedMonthEnd - dailyBudget;

  let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  if (projectedVariance > dailyBudget * 0.15) {
    status = 'DANGER';
  } else if (projectedVariance > 0) {
    status = 'WARNING';
  }

  return {
    dailySpendBudget: dailyBudget,
    mtdDailySpend: mtdSpend,
    remainingDailyBudget,
    remainingDays,
    recommendedToday,
    pace7Days,
    pace14Days,
    projectedMonthEnd,
    projectedVariance,
    status,
  };
}

/**
 * Generates historical monthly trends from 2024 to present
 */
export function generateMonthlyTrend(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  monthCount: number = 12
): Array<{
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  netCashFlow: number;
  netWorthEstimate: number;
}> {
  const result = [];
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const ym = `${yyyy}-${mm}`;
    const stats = calculateMonthlyStats(ym, transactions, categories, budgets);

    result.push({
      month: ym,
      monthLabel: `T${mm}/${yyyy.toString().slice(-2)}`,
      income: stats.income,
      expense: stats.expense,
      netCashFlow: stats.netCashFlow,
      netWorthEstimate: stats.income - stats.expense,
    });
  }

  return result;
}

/**
 * 6-Month Cash Requirement Forecast (Section 36)
 */
export function generate6MonthForecast(
  balances: AccountBalances,
  budgets: Budget[],
  recurring: Array<{ amount: number; type: string; isActive: boolean }>
): Array<{
  month: string;
  monthLabel: string;
  expectedIn: number;
  expectedOut: number;
  projectedCash: number;
}> {
  const result = [];
  const now = new Date();
  let currentCash = balances.totalCash;

  // Monthly recurring in/out
  const recurringIn = recurring
    .filter((r) => r.isActive && r.type === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0) || 59_500_000; // default combined salaries (Thắng 43M + Vân 16.5M)

  const recurringOut = recurring
    .filter((r) => r.isActive && r.type === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0) || 32_000_000;

  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const ym = `${yyyy}-${mm}`;

    const expectedIn = recurringIn;
    const expectedOut = recurringOut;
    currentCash += expectedIn - expectedOut;

    result.push({
      month: ym,
      monthLabel: `T${mm}/${yyyy}`,
      expectedIn,
      expectedOut,
      projectedCash: currentCash,
    });
  }

  return result;
}
