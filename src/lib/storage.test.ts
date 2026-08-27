import { describe, expect, it } from 'vitest';
import { importAppStateFromJSON } from './storage';

describe('importAppStateFromJSON', () => {
  it('drops legacy recurring transaction data from backups', () => {
    const state = importAppStateFromJSON(
      JSON.stringify({ transactions: [], accounts: [], recurringTransactions: [{ id: 'rec_1' }] })
    );

    expect(state).not.toHaveProperty('recurringTransactions');
  });
});
