
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, birthday?: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error('User profile not found. The database trigger may have failed.');
        console.log('Attempting to create user profile...');
        
        // Try to get user metadata from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Create user profile manually
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              phone: authUser.user_metadata?.phone || '',
              birthday: authUser.user_metadata?.birthday || null,
              role: authUser.user_metadata?.role || 'customer',
              fidelity_credits: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            setLoading(false);
            return;
          }

          console.log('User profile created successfully:', newUser);
          setUser(newUser);
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
  }, []);

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
  }, [fetchUserProfile]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to appropriate dashboard after login
      if (user.role === 'admin') {
        router.replace('/(admin)/');
      } else {
        router.replace('/(customer)/');
      }
    }
  }, [user, segments, loading, router]);

  const refreshUser = useCallback(async () => {
    if (supabaseUser) {
      // Refresh the session to get updated JWT with role in app_metadata
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      } else if (session) {
        console.log('Session refreshed successfully');
      }
      
      await fetchUserProfile(supabaseUser.id);
    }
  }, [supabaseUser, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email);
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      throw error;
    }

    console.log('Sign in successful:', data);
    
    // Refresh the session to ensure JWT has the latest role in app_metadata
    await supabase.auth.refreshSession();
    
    // The auth state change listener will handle fetching the profile and navigation
  };

  const signUp = async (email: string, password: string, name: string, phone: string, birthday?: string, role: UserRole = 'customer') => {
    console.log('Attempting to sign up:', email, 'with role:', role);
    
    // Create auth user with metadata that will be used by the trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed',
        data: {
          name,
          phone,
          birthday,
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
    console.log('Signing out...');
    setLoading(true);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      setLoading(false);
      throw error;
    }
    
    console.log('Sign out successful');
    setUser(null);
    setSupabaseUser(null);
    setLoading(false);
    
    // Navigate to login
    router.replace('/auth/login');
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
        refreshUser,
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
