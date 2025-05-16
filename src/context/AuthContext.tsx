import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';

type UserType = {
  id: string;
  email: string;
  role: 'student' | 'employer';
  onboardingCompleted: boolean;
  company_id?: string | null;
};

type AuthContextType = {
  user: UserType | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'student' | 'employer') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check initial session when provider mounts
    const checkInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };
    checkInitialSession();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        // Add retry logic for profile fetch
        let retries = 5;
        let profile = null;

        while (retries > 0 && !profile) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (data) {
              profile = data;
              setUser({
                id: session.user.id,
                email: session.user.email!,
                role: profile.role,
                onboardingCompleted: profile.onboarding_completed,
                company_id: profile.company_id
              });
              break;
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
          }

          retries--;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Initial session check
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: 'student' | 'employer') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }
        }
      });

      if (error) throw error;

      // Remove the manual upsert since trigger handles it
      // Add optional delay for profile propagation
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Force a session check after successful login
      const { data: { session: newSession } } = await supabase.auth.getSession();
      setSession(newSession);

      if (newSession?.user) {
        // Fetch profile data immediately
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single();

        if (profile) {
          setUser({
            id: newSession.user.id,
            email: newSession.user.email!,
            role: profile.role,
            onboardingCompleted: profile.onboarding_completed,
            company_id: profile.company_id
          });
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.replace('/login');
  };

  const completeOnboarding = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) throw error;
    setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
    router.replace('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};