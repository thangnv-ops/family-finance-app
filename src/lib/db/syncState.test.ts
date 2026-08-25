import { describe, it, expect } from 'vitest';
import { planCollectionSync } from './syncState';

describe('planCollectionSync', () => {
  it('detects upserts and deletes', () => {
    const prev = new Set(['a', 'b']);
    const next = new Set(['b', 'c']);
    expect(planCollectionSync(prev, next)).toEqual({
      upsertIds: ['b', 'c'],
      deleteIds: ['a'],
    });
  });
});
