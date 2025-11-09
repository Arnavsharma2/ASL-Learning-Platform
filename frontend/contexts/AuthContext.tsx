'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getUser().then(({ data, error }) => {
      if (data?.user && !error) {
        setUser(data.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password);
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await auth.signUp(email, password);
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const result = await auth.signInWithGoogle();
    if (result?.error) throw result.error;
    // If successful, OAuth will redirect, so we don't need to do anything else
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

