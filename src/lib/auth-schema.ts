export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  street_address?: string;
  suburb?: string;
  city?: string;
  postal_code?: string;
  avatar_url?: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  last_login?: string;
  login_count: number;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'collector' | 'customer' | 'member';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

export interface SignUpData extends AuthCredentials {
  fullName: string;
  phone?: string;
  streetAddress?: string;
  suburb?: string;
  city?: string;
  postalCode?: string;
  role?: UserRole;
}

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string;
  street_address?: string;
  suburb?: string;
  city?: string;
  postal_code?: string;
  avatar_url?: string;
  role?: UserRole;
}

// Role-based access control functions
export function canAccessAdmin(userRole: UserRole | null): boolean {
  return userRole === 'admin';
}

export function canAccessCollector(userRole: UserRole | null): boolean {
  return userRole === 'collector' || userRole === 'admin';
}

export function canAccessCustomer(userRole: UserRole | null): boolean {
  return userRole === 'customer' || userRole === 'admin';
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    collector: 'Collector',
    customer: 'Customer',
    member: 'Member',
  };
  return roleNames[role] || 'Unknown';
}

export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    admin: 'text-red-600 bg-red-100',
    collector: 'text-blue-600 bg-blue-100',
    customer: 'text-green-600 bg-green-100',
    member: 'text-gray-600 bg-gray-100',
  };
  return roleColors[role] || 'text-gray-600 bg-gray-100';
}

export function getRoleBadgeColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-500',
    collector: 'bg-blue-500',
    customer: 'bg-green-500',
    member: 'bg-gray-500',
  };
  return roleColors[role] || 'bg-gray-500';
}

// Default credentials for testing
export const defaultCredentials: AuthCredentials = {
  email: 'test@example.com',
  password: 'password123',
};

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validatePostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^\d{4,5}$/;
  return postalCodeRegex.test(postalCode);
}
