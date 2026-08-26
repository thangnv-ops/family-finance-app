/**
 * Family Finance App - Core TypeScript Domain Models
 * For Household: Thắng & Vân
 */

export type Role = 'OWNER' | 'MEMBER';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  role: Role;
  isActive: boolean;
}

export type FinancialAccountType = 'CASH_POOL' | 'CREDIT_LIABILITY';

export interface FinancialAccount {
  id: 'tk_thang' | 'tk_van' | 'tin_dung' | string;
  name: string;
  type: FinancialAccountType;
  ownerMemberId: string | null; // null for household/credit
  openingBalance: number;
  isActive: boolean;
  color: string;
}

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'LEND'
  | 'COLLECT_LOAN'
  | 'BORROW'
  | 'REPAY_LOAN'
  | 'CREDIT_PURCHASE'
  | 'CREDIT_PAYMENT'
  | 'CREDIT_REFUND'
  | 'REFUND'
  | 'SAVINGS_DEPOSIT'
  | 'SAVINGS_WITHDRAW'
  | 'BALANCE_ADJUSTMENT';

export type CategoryKind = 'EXPENSE' | 'INCOME' | 'BOTH';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  dailySpend: boolean; // Counts towards Daily Spending Advisor
  ownerScope?: 'ALL' | 'THANG' | 'VAN';
  isActive: boolean;
}

export interface Transaction {
  id: string;
  transactionDate: string; // YYYY-MM-DD
  transactionType: TransactionType;
  amount: number;
  currency: 'VND';
  description: string;
  note?: string;
  categoryId?: string;
  sourceAccountId?: string; // TK Thắng / TK Vân / Tín dụng
  destinationAccountId?: string; // for Transfer, Credit Payment, etc.
  memberId: string; // Thắng or Vân
  counterpartyId?: string; // for Lend/Borrow
  eventId?: string;
  goalId?: string;
  savingsDepositId?: string;
  loanId?: string;
  reversalOfTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SuggestionRule {
  id: string;
  keyword: string;
  matchType: 'CONTAINS' | 'EXACT' | 'STARTS_WITH';
  suggestedTransactionType: TransactionType;
  suggestedCategoryId?: string;
  suggestedSourceAccountId?: string;
  suggestedDestinationAccountId?: string;
  suggestedMemberId?: string;
  priority: number;
  isActive: boolean;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  categoryId: string;
  memberId?: string; // optional specific member or household
  budgetType: 'EXPENSE_LIMIT' | 'INCOME_TARGET' | 'SAVINGS_TARGET';
  plannedAmount: number;
}

export interface IncomePlan {
  id: string;
  month: string; // YYYY-MM
  sourceName: string;
  memberId: string;
  expectedAmount: number;
}

export interface CreditCardConfig {
  accountId: 'tin_dung';
  cardName: string;
  bank: string;
  creditLimit: number;
  statementDay: number; // e.g. 20th
  dueDay: number; // e.g. 5th
  annualFee: number;
  status: 'ACTIVE' | 'FROZEN' | 'CANCEL_PLANNED' | 'CLOSED';
  last4Digits?: string;
}

export interface CreditCardStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  statementDate: string;
  dueDate: string;
  calculatedAmount: number;
  actualStatementAmount?: number;
  paidAmount: number;
  minimumPayment?: number;
  status: 'OPEN' | 'CLOSED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
}

export interface InstallmentPlan {
  id: string;
  title: string;
  principal: number;
  months: number;
  annualInterestRate: number; // %
  fee: number;
  monthlyPayment: number;
  startMonth: string; // YYYY-MM
  paidMonths: number;
  remainingPrincipal: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface SavingsDeposit {
  id: string;
  provider: string; // Techcombank, VCB, MB, etc.
  productName: string;
  ownerMemberId?: string;
  openedAt: string; // YYYY-MM-DD
  principal: number;
  annualInterestRate: number; // %
  termMonths: number;
  maturityDate: string; // YYYY-MM-DD
  expectedInterest: number;
  expectedMaturityAmount: number;
  autoRenew: boolean;
  status: 'ACTIVE' | 'MATURED' | 'WITHDRAWN' | 'ROLLED_OVER';
  note?: string;
}

export interface Counterparty {
  id: string;
  name: string;
  phone?: string;
  note?: string;
}

export interface Loan {
  id: string;
  counterpartyId: string;
  direction: 'RECEIVABLE' | 'PAYABLE'; // Cho vay vs Đi vay
  principal: number;
  outstandingPrincipal: number;
  annualInterestRate?: number;
  expectedDueDate?: string;
  repaymentPriority?: number;
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'WRITTEN_OFF';
  note?: string;
  createdAt: string;
}

export interface PlannedExpense {
  id: string;
  title: string;
  categoryId?: string;
  goalId?: string;
  eventId?: string;
  expectedDate: string; // YYYY-MM-DD
  expectedAmount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'IDEA' | 'PLANNED' | 'READY' | 'PURCHASED' | 'POSTPONED' | 'CANCELLED';
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  goalType: 'PURCHASE' | 'TRAVEL' | 'EMERGENCY_FUND' | 'SAVINGS' | 'LIFESTYLE' | 'OTHER';
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'WISHLIST' | 'PLANNING' | 'FUNDING' | 'READY' | 'DONE' | 'CANCELLED';
  note?: string;
}

export interface EventBudget {
  id: string;
  name: string;
  eventType: 'TRAVEL' | 'WEDDING' | 'BABY' | 'FAMILY' | 'CELEBRATION' | 'OTHER';
  startDate: string;
  endDate?: string;
  budgetAmount?: number;
  status: 'PLANNING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  note?: string;
}

export interface EventBudgetItem {
  id: string;
  eventId: string;
  title: string;
  plannedAmount: number;
  actualAmount: number;
  dueDate?: string;
  status: 'TODO' | 'PLANNED' | 'BOOKED' | 'PAID' | 'DONE';
}

export interface EventContribution {
  id: string;
  eventId: string;
  counterpartyId: string;
  amount: number;
  receivedDate: string;
  contributionType: 'CASH_GIFT' | 'BANK_TRANSFER' | 'GIFT_VALUE' | 'OTHER';
  note?: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  dayOfMonth: number; // 1-31
  nextDate: string;
  categoryId: string;
  accountId: string;
  memberId: string;
  isActive: boolean;
  lastConfirmedDate?: string;
}

export interface AuditLog {
  id: string;
  entityType: 'TRANSACTION' | 'BALANCE_ADJUSTMENT' | 'BUDGET' | 'FUND' | 'LOAN' | 'SAVINGS';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECONCILE';
  description: string;
  userId: string;
  timestamp: string;
}
