import { supabase } from '../supabase';
import { createEmptyAppState } from '../emptyState';
import type { AppState } from '../storage';
import { ARRAY_COLLECTIONS, COLLECTION_TABLES, type ArrayCollectionKey } from './types';
import {
  rowToAccount,
  rowToAuditLog,
  rowToBudget,
  rowToCategory,
  rowToCounterparty,
  rowToCreditCardConfig,
  rowToCreditCardStatement,
  rowToEvent,
  rowToEventContribution,
  rowToEventItem,
  rowToFund,
  rowToGoal,
  rowToIncomePlan,
  rowToInstallmentPlan,
  rowToLoan,
  rowToMember,
  rowToPlannedExpense,
  rowToRecurringTransaction,
  rowToSavingsDeposit,
  rowToSuggestionRule,
  rowToTransaction,
} from './mappers';

type RowMapper = (row: Record<string, unknown>) => unknown;

const FROM_ROW: Record<ArrayCollectionKey, RowMapper> = {
  members: rowToMember,
  accounts: rowToAccount,
  categories: rowToCategory,
  transactions: rowToTransaction,
  suggestionRules: rowToSuggestionRule,
  budgets: rowToBudget,
  incomePlans: rowToIncomePlan,
  creditCardStatements: rowToCreditCardStatement,
  installmentPlans: rowToInstallmentPlan,
  savingsDeposits: rowToSavingsDeposit,
  counterparties: rowToCounterparty,
  loans: rowToLoan,
  funds: rowToFund,
  plannedExpenses: rowToPlannedExpense,
  goals: rowToGoal,
  events: rowToEvent,
  eventItems: rowToEventItem,
  eventContributions: rowToEventContribution,
  recurringTransactions: rowToRecurringTransaction,
  auditLogs: rowToAuditLog,
};

export async function loadAppStateFromDb(householdId: string): Promise<AppState> {
  const [householdRes, settingsRes, creditRes, ...collectionResults] = await Promise.all([
    supabase.from('households').select('name').eq('id', householdId).maybeSingle(),
    supabase.from('household_settings').select('*').eq('household_id', householdId).maybeSingle(),
    supabase.from('credit_card_config').select('*').eq('household_id', householdId).maybeSingle(),
    ...ARRAY_COLLECTIONS.map((key) =>
      supabase.from(COLLECTION_TABLES[key]).select('*').eq('household_id', householdId)
    ),
  ]);

  if (householdRes.error) throw householdRes.error;
  if (settingsRes.error) throw settingsRes.error;
  if (creditRes.error) throw creditRes.error;

  const householdName =
    (settingsRes.data?.household_name as string | undefined) ??
    (householdRes.data?.name as string | undefined) ??
    'Gia đình';

  const state = createEmptyAppState(householdName);
  state.currentMemberId =
    (settingsRes.data?.current_member_id as string | undefined) ?? 'all';
  if (settingsRes.data?.last_backup_date) {
    state.lastBackupDate = String(settingsRes.data.last_backup_date);
  }
  if (creditRes.data) {
    state.creditCardConfig = rowToCreditCardConfig(creditRes.data as Record<string, unknown>);
  }

  ARRAY_COLLECTIONS.forEach((key, index) => {
    const res = collectionResults[index];
    if (res.error) throw res.error;
    const rows = (res.data ?? []) as Record<string, unknown>[];
    (state as any)[key] = rows.map((row) => FROM_ROW[key](row));
  });

  return state;
}
