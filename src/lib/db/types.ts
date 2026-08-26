/** Collections that clients may upsert/delete (members are migration-owned, select-only). */
export const SYNCABLE_COLLECTIONS = [
  'accounts',
  'categories',
  'transactions',
  'suggestionRules',
  'budgets',
  'incomePlans',
  'creditCardStatements',
  'installmentPlans',
  'savingsDeposits',
  'counterparties',
  'loans',
  'plannedExpenses',
  'goals',
  'events',
  'eventItems',
  'eventContributions',
  'recurringTransactions',
  'auditLogs',
] as const;

/** Collection keys on AppState that load as row arrays with composite PK (household_id, id). */
export const ARRAY_COLLECTIONS = ['members', ...SYNCABLE_COLLECTIONS] as const;

export type ArrayCollectionKey = (typeof ARRAY_COLLECTIONS)[number];
export type SyncableCollectionKey = (typeof SYNCABLE_COLLECTIONS)[number];

export const COLLECTION_TABLES: Record<ArrayCollectionKey, string> = {
  members: 'members',
  accounts: 'accounts',
  categories: 'categories',
  transactions: 'transactions',
  suggestionRules: 'suggestion_rules',
  budgets: 'budgets',
  incomePlans: 'income_plans',
  creditCardStatements: 'credit_card_statements',
  installmentPlans: 'installment_plans',
  savingsDeposits: 'savings_deposits',
  counterparties: 'counterparties',
  loans: 'loans',
  plannedExpenses: 'planned_expenses',
  goals: 'goals',
  events: 'events',
  eventItems: 'event_items',
  eventContributions: 'event_contributions',
  recurringTransactions: 'recurring_transactions',
  auditLogs: 'audit_logs',
};
