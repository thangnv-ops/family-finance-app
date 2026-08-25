import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  AccessStatus,
  claimMembership,
  deriveAccessStatus,
  signInWithGoogle,
  signOut,
} from '../lib/auth';

export type AuthSessionState = {
  status: AccessStatus;
  householdId: string | null;
  memberKey: string | null;
  email: string | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [memberKey, setMemberKey] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<{ status: string } | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError(sessionError.message);
      setUser(null);
      setClaimStatus(null);
      setHouseholdId(null);
      setMemberKey(null);
      setBootstrapping(false);
      return;
    }
    const nextUser = data.session?.user ?? null;
    setUser(nextUser);
    if (!nextUser) {
      setClaimStatus(null);
      setHouseholdId(null);
      setMemberKey(null);
      setBootstrapping(false);
      return;
    }
    try {
      const claim = await claimMembership();
      setClaimStatus({ status: claim.status });
      if (claim.status === 'ok') {
        setHouseholdId(claim.householdId);
        setMemberKey(claim.memberKey);
      } else {
        setHouseholdId(null);
        setMemberKey(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xác thực quyền truy cập');
      setClaimStatus({ status: 'forbidden' });
      setHouseholdId(null);
      setMemberKey(null);
    } finally {
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const status: AccessStatus = bootstrapping
    ? 'loading'
    : deriveAccessStatus(user, claimStatus);

  return {
    status,
    householdId,
    memberKey,
    email: user?.email ?? null,
    error,
    signInWithGoogle: async () => {
      try {
        setError(null);
        await signInWithGoogle();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Đăng nhập Google thất bại');
      }
    },
    signOut: async () => {
      try {
        setError(null);
        await signOut();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Đăng xuất thất bại');
      }
    },
    refresh,
  };
}
