import { supabase } from '../supabase';
import type { AppState } from '../storage';
import { COLLECTION_TABLES, SYNCABLE_COLLECTIONS, type SyncableCollectionKey } from './types';
import {
  accountToRow,
  auditLogToRow,
  budgetToRow,
  categoryToRow,
  counterpartyToRow,
  creditCardConfigToRow,
  creditCardStatementToRow,
  eventContributionToRow,
  eventItemToRow,
  eventToRow,
  goalToRow,
  householdSettingsToRow,
  incomePlanToRow,
  installmentPlanToRow,
  loanToRow,
  plannedExpenseToRow,
  savingsDepositToRow,
  suggestionRuleToRow,
  transactionToRow,
} from './mappers';

export function planCollectionSync(
  prevIds: Set<string>,
  nextIds: Set<string>
): { upsertIds: string[]; deleteIds: string[] } {
  const upsertIds = [...nextIds];
  const deleteIds = [...prevIds].filter((id) => !nextIds.has(id));
  return { upsertIds, deleteIds };
}

function idsOf(items: { id: string }[]): Set<string> {
  return new Set(items.map((i) => i.id));
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

type RowMapper = (householdId: string, item: any) => Record<string, unknown>;

const TO_ROW: Record<SyncableCollectionKey, RowMapper> = {
  accounts: accountToRow,
  categories: categoryToRow,
  transactions: transactionToRow,
  suggestionRules: suggestionRuleToRow,
  budgets: budgetToRow,
  incomePlans: incomePlanToRow,
  creditCardStatements: creditCardStatementToRow,
  installmentPlans: installmentPlanToRow,
  savingsDeposits: savingsDepositToRow,
  counterparties: counterpartyToRow,
  loans: loanToRow,
  plannedExpenses: plannedExpenseToRow,
  goals: goalToRow,
  events: eventToRow,
  eventItems: eventItemToRow,
  eventContributions: eventContributionToRow,
  auditLogs: auditLogToRow,
};

export async function syncAppState(
  householdId: string,
  prev: AppState,
  next: AppState
): Promise<void> {
  for (const key of SYNCABLE_COLLECTIONS) {
    const table = COLLECTION_TABLES[key];
    const prevItems = prev[key] as { id: string }[];
    const nextItems = next[key] as { id: string }[];
    const { upsertIds, deleteIds } = planCollectionSync(idsOf(prevItems), idsOf(nextItems));
    const nextMap = byId(nextItems);

    if (deleteIds.length > 0) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('household_id', householdId)
        .in('id', deleteIds);
      if (error) throw error;
    }

    if (upsertIds.length > 0) {
      const rows = upsertIds.map((id) => TO_ROW[key](householdId, nextMap.get(id)!));
      const { error } = await supabase.from(table).upsert(rows, {
        onConflict: 'household_id,id',
      });
      if (error) throw error;
    }
  }

  const { error: settingsError } = await supabase.from('household_settings').upsert(
    householdSettingsToRow(
      householdId,
      next.householdName,
      next.currentMemberId,
      next.lastBackupDate
    ),
    { onConflict: 'household_id' }
  );
  if (settingsError) throw settingsError;

  const { error: creditError } = await supabase
    .from('credit_card_config')
    .upsert(creditCardConfigToRow(householdId, next.creditCardConfig), {
      onConflict: 'household_id',
    });
  if (creditError) throw creditError;
}
