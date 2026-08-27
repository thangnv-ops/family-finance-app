import type { AppState } from './storage';
import type { CreditCardConfig } from '../types/finance';

const emptyCredit: CreditCardConfig = {
  accountId: 'tin_dung',
  cardName: '',
  bank: '',
  creditLimit: 0,
  statementDay: 1,
  dueDay: 1,
  annualFee: 0,
  status: 'ACTIVE',
};

export function createEmptyAppState(householdName: string): AppState {
  return {
    householdName,
    currentMemberId: 'all',
    members: [],
    accounts: [],
    categories: [],
    transactions: [],
    suggestionRules: [],
    budgets: [],
    incomePlans: [],
    creditCardConfig: emptyCredit,
    creditCardStatements: [],
    installmentPlans: [],
    savingsDeposits: [],
    counterparties: [],
    loans: [],
    plannedExpenses: [],
    goals: [],
    events: [],
    eventItems: [],
    eventContributions: [],
    auditLogs: [],
  };
}
