// Woza Mali Office App Database Types
// TypeScript types for the unified schema - Office App specific

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

// Extended types with relationships for Office App
export interface UserWithArea extends User {
  area?: Area;
  addresses?: UserAddress[];
}

export interface CollectionWithDetails extends Collection {
  user?: User;
  collector?: User;
  pickup_address?: UserAddress;
  transactions?: Transaction[];
  pickup_items?: PickupItemWithMaterial[];
  pickup_photos?: PickupPhoto[];
}

// Material types (updated for unified schema)
export interface Material {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  unit: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Pickup Item types
export interface PickupItem {
  id: string;
  pickup_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  quality_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupItemWithMaterial extends PickupItem {
  material?: Material;
}

// Pickup Photo types
export interface PickupPhoto {
  id: string;
  pickup_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'general' | 'verification';
  taken_at: string;
  uploaded_by: string | null;
  created_at: string;
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

// Insert types for Office App (office can create all entities)
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

// Update types for Office App (office can update all entities)
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

// Office App specific filter types
export interface OfficeCollectionFilters {
  user_id?: string;
  collector_id?: string;
  status?: CollectionStatus;
  material_type?: string;
  area_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface OfficeUserFilters {
  role?: UserRole;
  area_id?: string;
  search?: string;
}

export interface OfficeTransactionFilters {
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

// Office App specific response types
export interface OfficeAppResponse<T> {
  data: T | null;
  error: any | null;
}

export interface OfficeAppListResponse<T> {
  data: T[] | null;
  error: any | null;
  count?: number;
}

// Office App specific analytics types
export interface OfficeAnalytics {
  total_users: number;
  total_collections: number;
  total_weight_collected: number;
  total_points_awarded: number;
  pending_collections: number;
  approved_collections: number;
  rejected_collections: number;
}

export interface AreaAnalytics {
  area_id: string;
  area_name: string;
  total_users: number;
  total_collections: number;
  total_weight: number;
  total_points: number;
  collectors_count: number;
}

export interface CollectionAnalytics {
  material_type: string;
  total_collections: number;
  total_weight: number;
  average_weight: number;
  approval_rate: number;
}

export interface UserAnalytics {
  role: UserRole;
  count: number;
  active_users: number;
  total_collections: number;
  total_points: number;
}
