import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
