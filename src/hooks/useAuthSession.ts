import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
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
  const runId = useRef(0);

  const applySession = useCallback(async (session: Session | null) => {
    const id = ++runId.current;
    setError(null);
    const nextUser = session?.user ?? null;
    setUser(nextUser);

    if (!nextUser) {
      if (id !== runId.current) return;
      setClaimStatus(null);
      setHouseholdId(null);
      setMemberKey(null);
      setBootstrapping(false);
      return;
    }

    try {
      const claim = await claimMembership();
      if (id !== runId.current) return;
      setClaimStatus({ status: claim.status });
      if (claim.status === 'ok') {
        setHouseholdId(claim.householdId);
        setMemberKey(claim.memberKey);
      } else {
        setHouseholdId(null);
        setMemberKey(null);
      }
    } catch (e) {
      if (id !== runId.current) return;
      setError(e instanceof Error ? e.message : 'Không thể xác thực quyền truy cập');
      setClaimStatus({ status: 'forbidden' });
      setHouseholdId(null);
      setMemberKey(null);
    } finally {
      if (id === runId.current) setBootstrapping(false);
    }
  }, []);

  const refresh = useCallback(async () => {
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
    await applySession(data.session);
  }, [applySession]);

  useEffect(() => {
    // Initial load outside the auth lock.
    void refresh();

    // Never await supabase client calls directly inside this callback (deadlock risk).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [applySession, refresh]);

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
