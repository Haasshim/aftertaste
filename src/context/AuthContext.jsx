import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { migrateLocalData } from '../lib/migrateLocalData';

const AuthContext = createContext(null);

// Local-only fallback when Supabase isn't configured yet. Lets the app run for
// development without a backend; clearly NOT a security boundary.
const LOCAL_SESSION_KEY = 'aftertaste:local-session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  // --- Supabase mode ---------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local fallback: restore a guest session if one was started.
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        setSession({ user: u, local: true });
      }
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch role from profiles whenever the user changes (server-side role is the
  // real check; this is only for client-side gating/UX).
  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setRole('user');
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (active && data?.role) setRole(data.role);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // One-time import of any pre-Supabase local logs into the account.
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    migrateLocalData(user.id).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('Local data migration skipped:', e);
    });
  }, [user]);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      const u = { id: 'local-user', email: email || 'guest@aftertaste.local', local: true };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
      setUser(u);
      setSession({ user: u, local: true });
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      return signIn(email, password);
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error, needsConfirmation: !error && !data.session };
  }, [signIn]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    isLocalMode: !isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
