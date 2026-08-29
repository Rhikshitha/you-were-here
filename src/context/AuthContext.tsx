import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';
import { ProfileRow } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: ProfileRow | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Session Hydration & Auth State Listener
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            const userProfile = await authService.ensureProfile(data.session.user);
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Subscribe to auth changes
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const userProfile = await authService.ensureProfile(currentSession.user);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await authService.getProfile(user.id);
      setProfile(updatedProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await authService.signIn(email, password);
    setIsLoading(false);
    if (res.error) return { error: res.error };
    if (res.data?.profile) setProfile(res.data.profile);
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    const res = await authService.signUp(email, password, username, displayName);
    setIsLoading(false);
    if (res.error) return { error: res.error };
    if (res.data?.profile) setProfile(res.data.profile);
    return { error: null };
  };

  const signOut = async () => {
    setIsLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
