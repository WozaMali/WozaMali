"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, streetAddress?: string, suburb?: string, city?: string, postalCode?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  updateProfile: (updates: { full_name?: string; phone?: string; street_address?: string; suburb?: string; city?: string; postal_code?: string; avatar_url?: string; role?: string }) => Promise<{ error: any }>;
  updateUserRole: (role: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Only run auth logic in the browser
    if (typeof window !== 'undefined') {
        // Get initial session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      await fetchUserRole(session.user.id);
    }
    
    setLoading(false);
  }).catch((error) => {
    console.error('Error getting session:', error);
    setLoading(false);
  });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Don't render children until mounted to prevent SSR issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserRole(data.role || 'member');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('member'); // Default role
    }
  };

         const signUp = async (email: string, password: string, fullName: string, phone?: string, streetAddress?: string, suburb?: string, city?: string, postalCode?: string, role: string = 'member') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            street_address: streetAddress || null,
            suburb: suburb || null,
            city: city || null,
            postal_code: postalCode || null,
            
          },
        },
      });

      if (!error) {
        // Create profile and wallet will be handled by database trigger
        console.log('User signed up successfully');
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string; street_address?: string; suburb?: string; city?: string; postal_code?: string; avatar_url?: string; role?: string }) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error && updates.role) {
        setUserRole(updates.role);
      }

      return { error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const updateUserRole = async (role: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (!error) {
        setUserRole(role);
      }

      return { error };
    } catch (error) {
      console.error('Update user role error:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    userRole,
    isAuthenticated: !!user,
    isLoading: loading,
    signUp,
    signIn,
    signOut,
    logout: signOut, // Alias for compatibility
    login: signIn, // Alias for compatibility
    updateProfile,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
