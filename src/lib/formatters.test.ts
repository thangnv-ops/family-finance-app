import { describe, it, expect } from 'vitest';
import { shiftMonth } from './formatters';

describe('shiftMonth', () => {
  it('goes to previous month', () => {
    expect(shiftMonth('2026-08', -1)).toBe('2026-07');
  });

  it('crosses year boundary', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});
