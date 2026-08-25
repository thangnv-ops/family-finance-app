import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AccessStatus = 'loading' | 'signed_out' | 'forbidden' | 'ready';

export type ClaimResult =
  | { status: 'ok'; householdId: string; memberKey: string }
  | { status: 'forbidden' };

export function deriveAccessStatus(
  sessionUser: Pick<User, 'id'> | null,
  claim: { status: string } | null
): AccessStatus {
  if (!sessionUser) return 'signed_out';
  if (!claim) return 'loading';
  if (claim.status === 'ok') return 'ready';
  return 'forbidden';
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function claimMembership(): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_household_membership');
  if (error) throw error;
  const payload = data as {
    status: string;
    household_id?: string;
    member_key?: string;
  };
  if (payload.status !== 'ok' || !payload.household_id || !payload.member_key) {
    return { status: 'forbidden' };
  }
  return {
    status: 'ok',
    householdId: payload.household_id,
    memberKey: payload.member_key,
  };
}
