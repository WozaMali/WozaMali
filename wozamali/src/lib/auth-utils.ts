import { supabase } from './supabase';

/**
 * Request a password reset for a user
 * @param email - User's email address
 * @returns Promise with success/error status
 */
export const requestPasswordReset = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};

/**
 * Update user password (used after password reset)
 * @param password - New password
 * @returns Promise with success/error status
 */
export const updatePassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation results
 */
export const validatePassword = (password: string) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength;
  
  return {
    isValid,
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    strength: calculatePasswordStrength(password),
    suggestions: generatePasswordSuggestions(password)
  };
};

/**
 * Calculate password strength score (0-100)
 * @param password - Password to evaluate
 * @returns Strength score
 */
const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  // Length contribution
  if (password.length >= 8) score += 25;
  else if (password.length >= 6) score += 15;
  
  // Character variety contribution
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  
  // Bonus for longer passwords
  if (password.length > 12) score += 20;
  
  return Math.min(score, 100);
};

/**
 * Generate password improvement suggestions
 * @param password - Current password
 * @returns Array of suggestions
 */
const generatePasswordSuggestions = (password: string): string[] => {
  const suggestions: string[] = [];
  
  if (password.length < 8) {
    suggestions.push('Make your password at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Add at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('Add at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    suggestions.push('Add at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    suggestions.push('Add at least one special character');
  }
  
  return suggestions;
};

/**
 * Check if user is authenticated
 * @returns Promise with authentication status
 */
export const checkAuthStatus = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { isAuthenticated: false, user: null, error: error.message };
    }
    
    return { isAuthenticated: !!user, user, error: null };
  } catch (error) {
    return { 
      isAuthenticated: false, 
      user: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};

/**
 * Sign out user
 * @returns Promise with success/error status
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};
