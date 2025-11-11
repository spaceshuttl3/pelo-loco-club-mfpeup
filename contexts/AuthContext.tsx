
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // Retry logic for profile fetching (in case trigger hasn't completed yet)
      let retries = 3;
      let data = null;
      let error = null;

      while (retries > 0 && !data) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        data = result.data;
        error = result.error;

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist yet, wait and retry
          console.log(`Profile not found, retrying... (${retries} attempts left)`);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
        } else {
          break;
        }
      }

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile still doesn't exist after retries, this is an error
        if (error.code === 'PGRST116') {
          console.error('User profile was not created. This should not happen with the trigger in place.');
        }
        
        setLoading(false);
        return;
      }

      console.log('User profile fetched successfully:', data);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    console.log('Sign in successful:', data);
  };

  const signUp = async (email: string, password: string, name: string, phone: string, role: UserRole = 'customer') => {
    console.log('Attempting to sign up:', email);
    
    // Create auth user with metadata that will be used by the trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed',
        data: {
          name,
          phone,
          role,
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw authError;
    }

    console.log('Auth user created successfully:', authData);
    
    // The database trigger will automatically create the user profile
    // No need to manually insert into the users table
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSupabaseUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
      }}
    >
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
