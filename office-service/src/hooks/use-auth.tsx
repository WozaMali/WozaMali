import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthCredentials, AuthResponse } from '@/lib/auth-schema';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount and listen for auth changes
  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkAuth();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Get current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile && !profileError) {
          const userData: User = {
            id: profile.id,
            username: profile.username || profile.email,
            email: profile.email,
            role: profile.role,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            isActive: profile.is_active || true,
            lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
            createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
            updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
          };
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username, // Assuming username is email
        password: credentials.password,
      });
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Login failed',
        };
      }
      
      if (data.user) {
        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          return {
            success: false,
            error: 'Failed to load user profile',
          };
        }
        
        const userData: User = {
          id: profile.id,
          username: profile.username || profile.email,
          email: profile.email,
          role: profile.role,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          isActive: profile.is_active || true,
          lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
          createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
          updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
        };
        
        // Update state
        setUser(userData);
        
        // Generate redirect path based on role
        let redirectTo = '/dashboard';
        if (userData.role === 'COLLECTOR') {
          redirectTo = '/collector';
        } else if (userData.role === 'ADMIN' || userData.role === 'STAFF') {
          redirectTo = '/admin';
        }
        
        return {
          success: true,
          user: userData,
          token: data.session?.access_token,
          redirectTo,
        };
      } else {
        return {
          success: false,
          error: 'Login failed - no user data received',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any stored redirect information
      sessionStorage.removeItem('redirectAfterLogin');
      
      // Clear state
      setUser(null);
      
      // Force redirect to login page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state and redirect even if Supabase logout fails
      setUser(null);
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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
