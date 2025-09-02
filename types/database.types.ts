// Woza Mali Database Types for Supabase
// Generated TypeScript types for the unified schema

export type UserRole = 'resident' | 'collector' | 'office';
export type CollectionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'collection' | 'withdrawal' | 'bonus' | 'penalty';

export interface Area {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  phone: string | null;
  area_id: string | null;
  role: UserRole;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: 'primary' | 'secondary' | 'pickup' | 'billing';
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  country: string;
  coordinates: string | null; // POINT as string
  is_default: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  collector_id: string | null;
  pickup_address_id: string | null;
  material_type: string;
  weight_kg: number;
  photo_url: string | null;
  status: CollectionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  collection_id: string | null;
  points: number;
  transaction_type: TransactionType;
  description: string | null;
  created_at: string;
}

// Extended types with relationships
export interface UserWithArea extends User {
  area?: Area;
  addresses?: UserAddress[];
}

export interface CollectionWithDetails extends Collection {
  user?: User;
  collector?: User;
  pickup_address?: UserAddress;
  transactions?: Transaction[];
}

export interface TransactionWithDetails extends Transaction {
  user?: User;
  collection?: Collection;
}

// Database view types
export interface UserCollectionsSummary {
  user_id: string;
  user_name: string;
  role: UserRole;
  area_name: string | null;
  total_collections: number;
  total_weight: number;
  approved_collections: number;
  pending_collections: number;
}

export interface UserPointsSummary {
  user_id: string;
  user_name: string;
  total_points: number;
  total_transactions: number;
}

// Insert types (without auto-generated fields)
export interface AreaInsert {
  id?: string;
  name: string;
}

export interface UserInsert {
  id?: string;
  name: string;
  phone?: string | null;
  area_id?: string | null;
  role: UserRole;
  email?: string | null;
}

export interface UserAddressInsert {
  id?: string;
  user_id: string;
  address_type?: 'primary' | 'secondary' | 'pickup' | 'billing';
  address_line1: string;
  address_line2?: string | null;
  city: string;
  province: string;
  postal_code?: string | null;
  country?: string;
  coordinates?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  notes?: string | null;
}

export interface CollectionInsert {
  id?: string;
  user_id: string;
  collector_id?: string | null;
  pickup_address_id?: string | null;
  material_type: string;
  weight_kg: number;
  photo_url?: string | null;
  status?: CollectionStatus;
  notes?: string | null;
}

export interface TransactionInsert {
  id?: string;
  user_id: string;
  collection_id?: string | null;
  points: number;
  transaction_type?: TransactionType;
  description?: string | null;
}

// Update types (all fields optional except id)
export interface AreaUpdate {
  name?: string;
}

export interface UserUpdate {
  name?: string;
  phone?: string | null;
  area_id?: string | null;
  role?: UserRole;
  email?: string | null;
}

export interface UserAddressUpdate {
  address_type?: 'primary' | 'secondary' | 'pickup' | 'billing';
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  province?: string;
  postal_code?: string | null;
  country?: string;
  coordinates?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  notes?: string | null;
}

export interface CollectionUpdate {
  collector_id?: string | null;
  pickup_address_id?: string | null;
  material_type?: string;
  weight_kg?: number;
  photo_url?: string | null;
  status?: CollectionStatus;
  notes?: string | null;
}

export interface TransactionUpdate {
  points?: number;
  transaction_type?: TransactionType;
  description?: string | null;
}

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: any | null;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: any | null;
  count?: number;
}

// Filter and query types
export interface CollectionFilters {
  user_id?: string;
  collector_id?: string;
  status?: CollectionStatus;
  material_type?: string;
  area_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface UserFilters {
  role?: UserRole;
  area_id?: string;
  search?: string;
}

export interface TransactionFilters {
  user_id?: string;
  transaction_type?: TransactionType;
  date_from?: string;
  date_to?: string;
}

// Pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

// Sorting
export interface SortOptions {
  column: string;
  ascending?: boolean;
}
