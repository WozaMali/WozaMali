import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      // ============================================================================
      // UNIFIED SCHEMA TABLES
      // ============================================================================
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: any
          created_at?: string
          updated_at?: string
        }
      }
      areas: {
        Row: {
          id: string
          name: string
          description: string | null
          city: string
          province: string | null
          postal_code: string
          subdivisions: any | null
          boundaries: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          city?: string
          province?: string | null
          postal_code: string
          subdivisions?: any | null
          boundaries?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          city?: string
          province?: string | null
          postal_code?: string
          subdivisions?: any | null
          boundaries?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          date_of_birth: string | null
          phone: string | null
          email: string
          role_id: string
          area_id: string | null
          street_addr: string | null
          township_id: string | null
          subdivision: string | null
          city: string
          postal_code: string | null
          suburb: string | null
          status: 'active' | 'suspended' | 'deleted'
          last_login: string | null
          login_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          date_of_birth?: string | null
          phone?: string | null
          email: string
          role_id: string
          area_id?: string | null
          street_addr?: string | null
          township_id?: string | null
          subdivision?: string | null
          city?: string
          postal_code?: string | null
          suburb?: string | null
          status?: 'active' | 'suspended' | 'deleted'
          last_login?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          date_of_birth?: string | null
          phone?: string | null
          email?: string
          role_id?: string
          area_id?: string | null
          street_addr?: string | null
          township_id?: string | null
          subdivision?: string | null
          city?: string
          postal_code?: string | null
          suburb?: string | null
          status?: 'active' | 'suspended' | 'deleted'
          last_login?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================================================
      // LEGACY TABLES (KEPT FOR BACKWARD COMPATIBILITY)
      // ============================================================================
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          street_address: string | null
          suburb: string | null
          ext_zone_phase: string | null
          city: string | null
          postal_code: string | null
          avatar_url: string | null
          email_verified: boolean
          phone_verified: boolean
          last_login: string | null
          login_count: number
          status: 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          street_address?: string | null
          suburb?: string | null
          ext_zone_phase?: string | null
          city?: string | null
          postal_code?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          phone_verified?: boolean
          last_login?: string | null
          login_count?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          street_address?: string | null
          suburb?: string | null
          ext_zone_phase?: string | null
          city?: string | null
          postal_code?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          phone_verified?: boolean
          last_login?: string | null
          login_count?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_points: number
          tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_points?: number
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_points?: number
          tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      enhanced_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_points: number
          tier: string
          sync_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_points?: number
          tier?: string
          sync_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_points?: number
          tier?: string
          sync_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          name: string
          category: string
          unit_price: number
          unit: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit_price?: number
          unit?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit_price?: number
          unit?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pickup_items: {
        Row: {
          id: string
          pickup_id: string
          material_id: string
          quantity: number
          unit_price: number
          total_price: number
          quality_rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pickup_id: string
          material_id: string
          quantity: number
          unit_price?: number
          total_price?: number
          quality_rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pickup_id?: string
          material_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          quality_rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pickup_photos: {
        Row: {
          id: string
          pickup_id: string
          photo_url: string
          photo_type: 'before' | 'after' | 'general' | 'verification'
          taken_at: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pickup_id: string
          photo_url: string
          photo_type: 'before' | 'after' | 'general' | 'verification'
          taken_at?: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pickup_id?: string
          photo_url?: string
          photo_type?: 'before' | 'after' | 'general' | 'verification'
          taken_at?: string
          uploaded_by?: string | null
          created_at?: string
        }
      }
      pickups: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          status: string
          pickup_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight_kg?: number
          status?: string
          pickup_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight_kg?: number
          status?: string
          pickup_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_metrics: {
        Row: {
          id: string
          user_id: string
          co2_saved_kg: number
          water_saved_liters: number
          landfill_saved_kg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          co2_saved_kg?: number
          water_saved_liters?: number
          landfill_saved_kg?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          co2_saved_kg?: number
          water_saved_liters?: number
          landfill_saved_kg?: number
          created_at?: string
          updated_at?: string
        }
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          expires_at: string
          used: boolean
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          expires_at: string
          used?: boolean
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          expires_at?: string
          used?: boolean
          created_at?: string
          used_at?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_info: any | null
          ip_address: string | null
          expires_at: string
          created_at: string
          last_activity: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_info?: any | null
          ip_address?: string | null
          expires_at: string
          created_at?: string
          last_activity?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_info?: any | null
          ip_address?: string | null
          expires_at?: string
          created_at?: string
          last_activity?: string
        }
      }
      user_activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          description: string | null
          metadata: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          description?: string | null
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          description?: string | null
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          template_name: string
          subject: string
          html_content: string
          text_content: string | null
          variables: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_name: string
          subject: string
          html_content: string
          text_content?: string | null
          variables?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_name?: string
          subject?: string
          html_content?: string
          text_content?: string | null
          variables?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_logs: {
        Row: {
          id: string
          user_id: string | null
          template_name: string | null
          recipient_email: string
          subject: string
          status: 'sent' | 'delivered' | 'failed' | 'bounced'
          sent_at: string
          delivered_at: string | null
          error_message: string | null
          metadata: any | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          template_name?: string | null
          recipient_email: string
          subject: string
          status: 'sent' | 'delivered' | 'failed' | 'bounced'
          sent_at?: string
          delivered_at?: string | null
          error_message?: string | null
          metadata?: any | null
        }
        Update: {
          id?: string
          user_id?: string | null
          template_name?: string | null
          recipient_email?: string
          subject?: string
          status?: 'sent' | 'delivered' | 'failed' | 'bounced'
          sent_at?: string
          delivered_at?: string | null
          error_message?: string | null
          metadata?: any | null
        }
      }
    }
    Functions: {
      create_password_reset_token: {
        Args: {
          user_email: string
        }
        Returns: string
      }
      verify_password_reset_token: {
        Args: {
          token: string
        }
        Returns: string
      }
      cleanup_expired_data: {
        Args: {}
        Returns: undefined
      }
    }
  }
}

// ============================================================================
// UNIFIED SCHEMA TYPES
// ============================================================================

// Material types
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

export interface MaterialInsert {
  id?: string;
  name: string;
  category: string;
  unit_price?: number;
  unit?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialUpdate {
  id?: string;
  name?: string;
  category?: string;
  unit_price?: number;
  unit?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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

export interface PickupItemInsert {
  id?: string;
  pickup_id: string;
  material_id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  quality_rating?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PickupItemUpdate {
  id?: string;
  pickup_id?: string;
  material_id?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  quality_rating?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
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

export interface PickupPhotoInsert {
  id?: string;
  pickup_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'general' | 'verification';
  taken_at?: string;
  uploaded_by?: string | null;
  created_at?: string;
}

export interface PickupPhotoUpdate {
  id?: string;
  pickup_id?: string;
  photo_url?: string;
  photo_type?: 'before' | 'after' | 'general' | 'verification';
  taken_at?: string;
  uploaded_by?: string | null;
  created_at?: string;
}

// Extended types with relationships
export interface PickupItemWithMaterial extends PickupItem {
  material?: Material;
}

export interface MaterialWithPickupItems extends Material {
  pickup_items?: PickupItem[];
}

// ============================================================================
// UNIFIED SCHEMA TYPES
// ============================================================================

// User types
export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  email: string;
  role_id: string;
  area_id?: string;
  street_addr?: string;
  township_id?: string;
  subdivision?: string;
  city: string;
  postal_code?: string;
  suburb?: string; // Legacy field
  status: 'active' | 'suspended' | 'deleted';
  last_login?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  email: string;
  role_id: string;
  area_id?: string;
  street_addr?: string;
  township_id?: string;
  subdivision?: string;
  city?: string;
  postal_code?: string;
  suburb?: string;
  status?: 'active' | 'suspended' | 'deleted';
  last_login?: string;
  login_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  role_id?: string;
  area_id?: string;
  street_addr?: string;
  township_id?: string;
  subdivision?: string;
  city?: string;
  postal_code?: string;
  suburb?: string;
  status?: 'active' | 'suspended' | 'deleted';
  last_login?: string;
  login_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: any;
  created_at: string;
  updated_at: string;
}

// Area types
export interface Area {
  id: string;
  name: string;
  description?: string;
  city: string;
  province?: string;
  postal_code: string;
  subdivisions?: string[];
  boundaries?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Township dropdown types
export interface TownshipDropdown {
  id: string;
  township_name: string;
  postal_code: string;
  city: string;
  subdivisions: string[];
}

// Subdivision dropdown types
export interface SubdivisionDropdown {
  area_id: string;
  township_name: string;
  postal_code: string;
  subdivision: string;
}

// Residents view types
export interface Resident {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  street_addr?: string;
  township_id?: string;
  township_name?: string;
  subdivision?: string;
  suburb?: string; // Legacy field
  city: string;
  postal_code?: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
  address_status: 'complete' | 'legacy' | 'incomplete';
}

// Extended types with relationships
export interface UserWithRole extends User {
  role?: Role;
}

export interface UserWithArea extends User {
  area?: Area;
}

export interface UserWithTownship extends User {
  township?: Area;
}

export interface UserComplete extends User {
  role?: Role;
  area?: Area;
  township?: Area;
}
