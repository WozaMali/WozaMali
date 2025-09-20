"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { saveSessionData, clearSessionData, updateLastActivity, getSessionData } from '@/lib/session-utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bootGrace: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, streetAddress?: string, suburb?: string, city?: string, postalCode?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  updateProfile: (updates: { full_name?: string; phone?: string; street_address?: string; suburb?: string; city?: string; postal_code?: string; avatar_url?: string; role?: string }) => Promise<{ error: any }>;
  updateUserRole: (role: string) => Promise<{ error: any }>;
  forceLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [bootGrace, setBootGrace] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  // Removed aggressive force-complete logic to avoid masking issues
  const initRef = useRef(false);

  // Define fetchUserRole function before using it
  const fetchUserRole = async (userId: string) => {
    console.log('AuthContext: Starting role fetch for user:', userId);
    setRoleLoading(true);
    try {
      // Prefer unified user_profiles (user_id links to auth.users.id)
      const unified = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role = (!unified.error && unified.data) ? (unified.data as any).role : null;
      console.log('AuthContext: Role fetch result:', role || 'member');
      setUserRole(role || 'member');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('member'); // Default role
    } finally {
      setRoleLoading(false);
      console.log('AuthContext: Role loading complete');
    }
  };

  useEffect(() => {
    if (initRef.current) return; // Prevent double init (React Strict Mode)
    initRef.current = true;

    setMounted(true);
    // Small grace window to prevent redirect flicker during hard refreshes
    const graceTimer = setTimeout(() => {
      console.log('AuthContext: Boot grace period ended');
      setBootGrace(false);
    }, 500);

    // Removed aggressive force completion timer

    // Handle app visibility changes to prevent loading loops
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log('AuthContext: App visibility changed:', isVisible);
      
      if (isVisible && !loading) {
        // App became visible and we're not loading, ensure we're in a good state
        console.log('AuthContext: App became visible, checking session...');
        // Don't reload session unnecessarily, just ensure loading state is correct
        if (user && !session) {
          console.log('AuthContext: User exists but no session, reloading...');
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setSession(session);
              setUser(session.user);
            }
          });
        }
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);
    
    // Only run auth logic in the browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check if supabase is properly initialized
    if (!supabase.auth) {
      console.error('Supabase auth not available');
      setLoading(false);
      return;
    }

    // Hydrate cached role immediately to stabilize role-gated UIs during refresh
    try {
      const cached = getSessionData();
      if (cached?.userRole) {
        setUserRole(cached.userRole);
      }
    } catch {}

    // Get initial session (one-time)
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log('AuthContext: Got initial session:', !!session, 'user:', !!session?.user);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserRole(session.user.id);
          // Persist basic session info for faster hydration on next load
          saveSessionData(session.user.id, userRole || 'member');
        }
        setLoading(false);
        console.log('AuthContext: Initial session loading complete');
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
      });

    // Listen for auth changes (one subscription)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          await fetchUserRole(session.user.id);
          if (session.user.id) {
            saveSessionData(session.user.id, session.user.user_metadata?.role || 'member');
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setRoleLoading(false);
          clearSessionData();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
          updateLastActivity();
        }

        setLoading(false);
      }
    );

    return () => {
      try { subscription.unsubscribe(); } catch {}
      clearTimeout(graceTimer);
      // no force timer to clear
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, []);

  // Don't render children until mounted to prevent SSR issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

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
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.session) {
        console.log('Sign in successful, session:', data.session);
      }

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
      
      // Clear session data
      clearSessionData();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't return here, continue with cleanup
      }
      
      // Clear any stored data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refreshToken');
          sessionStorage.clear();
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError);
        }
      }
      
      console.log('User signed out successfully');
      
      // Use window.location for sign out to ensure complete state reset
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
      
      // Clear session data
      clearSessionData();
      
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
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
      // Try unified table first
      let errorOut: any = null;
      const unified = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('user_id', user.id);
      if (unified.error) {
        errorOut = unified.error;
        // Fallback to legacy profiles
        const legacy = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', user.id);
        if (legacy.error) {
          errorOut = legacy.error;
        } else {
          errorOut = null;
        }
      }

      if (!errorOut) {
        setUserRole(role);
      }

      return { error: errorOut };
    } catch (error) {
      console.error('Update user role error:', error);
      return { error };
    }
  };

  const forceLogout = async () => {
    try {
      console.log('Force logout: Clearing all authentication state...');
      
      // Clear all local state immediately
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
      
      // Clear any stored data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refreshToken');
          sessionStorage.clear();
          localStorage.clear();
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError);
        }
      }
      
      // Attempt to clear Supabase session (don't wait for it)
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.warn('Supabase sign out error during force logout:', supabaseError);
      }
      
      console.log('Force logout: All state cleared successfully');
      
      // Force a complete page reload
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
      
    } catch (error) {
      console.error('Force logout error:', error);
      // Clear state even if there's an error and force redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    userRole,
    isAuthenticated: !!user,
    isLoading: loading || roleLoading,
    signUp,
    signIn,
    signOut,
    logout: signOut, // Alias for compatibility
    login: signIn, // Alias for compatibility
    updateProfile,
    updateUserRole,
    forceLogout, // Add this to the context
    bootGrace, // Expose bootGrace for components that need it
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
