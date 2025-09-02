import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in the browser and environment variables are missing
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Create a fallback client or the real client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
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
