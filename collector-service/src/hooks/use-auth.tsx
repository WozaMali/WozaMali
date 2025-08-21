import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, AuthCredentials, AuthResponse } from '@/lib/auth-schema';
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
            username: profile.email, // Use email as username since username column doesn't exist
            email: profile.email,
            role: profile.role.toUpperCase() as UserRole, // Ensure role is uppercase
            firstName: profile.full_name ? profile.full_name.split(' ')[0] || '' : '', // Extract first name from full_name
            lastName: profile.full_name ? profile.full_name.split(' ').slice(1).join(' ') || '' : '', // Extract last name from full_name
            isActive: profile.is_active !== undefined ? profile.is_active : true,
            lastLogin: new Date(), // Set current time as last login since column doesn't exist
            createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
            updatedAt: profile.created_at ? new Date(profile.created_at) : new Date(), // Use created_at as updated_at since column doesn't exist
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
          console.error('Profile error:', profileError);
          
          // If profile doesn't exist, create a basic one
          if (profileError.code === 'PGRST116') { // No rows returned
            console.log('Profile not found, creating basic profile...');
            
            // Create a basic profile with available data
            // Only include columns that exist in the current schema
            const basicProfile: any = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              role: 'collector', // Default to collector for now
            };
            
            // Add optional columns if they might exist
            if (data.user.phone) {
              basicProfile.phone = data.user.phone;
            }
            
            // Note: We'll let the database handle defaults for columns like is_active and created_at
            
            // Try to insert the profile
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(basicProfile);
            
            if (insertError) {
              console.error('Failed to create profile:', insertError);
              return {
                success: false,
                error: 'Failed to create user profile. Please contact support.',
              };
            }
            
            // Use the basic profile we just created
            const userData: User = {
              id: basicProfile.id,
              username: basicProfile.email,
              email: basicProfile.email,
              role: basicProfile.role.toUpperCase() as UserRole,
              firstName: basicProfile.full_name.split(' ')[0] || '',
              lastName: basicProfile.full_name.split(' ').slice(1).join(' ') || '',
              isActive: true, // Default to active
              lastLogin: new Date(),
              createdAt: new Date(), // Use current time
              updatedAt: new Date(), // Use current time
            };
            
            setUser(userData);
            
            return {
              success: true,
              user: userData,
              token: data.session?.access_token,
              redirectTo: '/collector',
            };
          }
          
          return {
            success: false,
            error: 'Failed to load user profile: ' + profileError.message,
          };
        }
        
        const userData: User = {
          id: profile.id,
          username: profile.email, // Use email as username since username column doesn't exist
          email: profile.email,
          role: profile.role.toUpperCase() as UserRole, // Ensure role is uppercase
          firstName: profile.full_name ? profile.full_name.split(' ')[0] || '' : '', // Extract first name from full_name
          lastName: profile.full_name ? profile.full_name.split(' ').slice(1).join(' ') || '' : '', // Extract last name from full_name
          isActive: profile.is_active !== undefined ? profile.is_active : true,
          lastLogin: new Date(), // Set current time as last login since column doesn't exist
          createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
          updatedAt: profile.created_at ? new Date(profile.created_at) : new Date(), // Use created_at as updated_at since column doesn't exist
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
