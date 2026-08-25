import { describe, it, expect } from 'vitest';
import { createEmptyAppState } from './emptyState';

describe('createEmptyAppState', () => {
  it('returns zero financial collections and default members filter', () => {
    const state = createEmptyAppState('Gia đình Thắng & Vân');
    expect(state.householdName).toBe('Gia đình Thắng & Vân');
    expect(state.currentMemberId).toBe('all');
    expect(state.transactions).toEqual([]);
    expect(state.accounts).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.budgets).toEqual([]);
    expect(state.members).toEqual([]);
  });
});
