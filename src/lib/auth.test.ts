import { describe, it, expect } from 'vitest';
import { deriveAccessStatus } from './auth';

describe('deriveAccessStatus', () => {
  it('signed_out when no user', () => {
    expect(deriveAccessStatus(null, null)).toBe('signed_out');
  });
  it('forbidden when claim forbidden', () => {
    expect(deriveAccessStatus({ id: 'u1' } as { id: string }, { status: 'forbidden' })).toBe(
      'forbidden'
    );
  });
  it('ready when claim ok', () => {
    expect(deriveAccessStatus({ id: 'u1' } as { id: string }, { status: 'ok' })).toBe('ready');
  });
});
