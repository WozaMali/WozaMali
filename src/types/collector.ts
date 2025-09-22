// WozaMoney Collector Types
// These types correspond to the collector data in your Supabase database

export interface CollectionArea {
  id: string;
  name: string;
  township_id?: string;
  ext_zone_phase?: string;
  city: string;
  province: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionSchedule {
  id: string;
  area_id: string;
  collector_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionRoute {
  id: string;
  name: string;
  description?: string;
  area_ids: string[];
  collector_id: string;
  estimated_duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionLog {
  id: string;
  collector_id: string;
  area_id: string;
  route_id?: string;
  collection_date: string;
  start_time?: string;
  end_time?: string;
  households_visited: number;
  households_collected: number;
  total_weight_kg: number;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface HouseholdCollection {
  id: string;
  collection_log_id: string;
  household_id: string;
  collection_date: string;
  weight_kg: number;
  items_collected: string[];
  payment_amount: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

// API response types
export interface CollectorAreasResponse {
  data: CollectionArea[] | null;
  error: string | null;
}

export interface CollectorSchedulesResponse {
  data: CollectionSchedule[] | null;
  error: string | null;
}

export interface CollectorRoutesResponse {
  data: CollectionRoute[] | null;
  error: string | null;
}

export interface CollectionLogsResponse {
  data: CollectionLog[] | null;
  error: string | null;
}

export interface HouseholdCollectionsResponse {
  data: HouseholdCollection[] | null;
  error: string | null;
}

// Form data types
export interface CollectionLogFormData {
  collector_id?: string;
  area_id: string;
  route_id?: string;
  collection_date: string;
  start_time?: string;
  end_time?: string;
  households_visited: number;
  households_collected: number;
  total_weight_kg: number;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface HouseholdCollectionFormData {
  household_id: string;
  weight_kg: number;
  items_collected: string[];
  payment_amount: number;
  payment_method: string;
  notes?: string;
}

// Utility types
export interface CollectorStats {
  total_areas: number;
  total_routes: number;
  total_collections_today: number;
  total_weight_today: number;
  total_households_today: number;
}

export interface DaySchedule {
  day: string;
  dayNumber: number;
  areas: CollectionArea[];
  startTime: string;
  endTime: string;
}

// Constants
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export const COLLECTION_STATUSES = [
  'scheduled',
  'in_progress', 
  'completed',
  'cancelled'
] as const;

export const PAYMENT_METHODS = [
  'points',
  'cash',
  'bank_transfer',
  'mobile_money'
] as const;

export const RECYCLABLE_ITEMS = [
  'plastic_bottles',
  'glass_bottles',
  'paper',
  'cardboard',
  'aluminum_cans',
  'steel_cans',
  'electronics',
  'batteries',
  'textiles',
  'other'
] as const;
