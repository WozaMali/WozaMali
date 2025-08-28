import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript - Updated to match rewards-metrics-system schema
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
          role: 'customer' | 'collector' | 'admin'
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
          role?: 'customer' | 'collector' | 'admin'
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
          role?: 'customer' | 'collector' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      
      // Enhanced wallet system
      enhanced_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_points: number
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          external_wallet_id: string | null
          last_sync_at: string | null
          sync_status: 'synced' | 'pending' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_points?: number
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          external_wallet_id?: string | null
          last_sync_at?: string | null
          sync_status?: 'synced' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_points?: number
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          external_wallet_id?: string | null
          last_sync_at?: string | null
          sync_status?: 'synced' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }

      // Reward system
      reward_definitions: {
        Row: {
          id: string
          reward_code: string
          name: string
          description: string | null
          points_cost: number
          monetary_value: number
          reward_type: 'discount' | 'cashback' | 'product' | 'service' | 'badge'
          is_active: boolean
          external_reward_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reward_code: string
          name: string
          description?: string | null
          points_cost?: number
          monetary_value?: number
          reward_type: 'discount' | 'cashback' | 'product' | 'service' | 'badge'
          is_active?: boolean
          external_reward_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reward_code?: string
          name?: string
          description?: string | null
          points_cost?: number
          monetary_value?: number
          reward_type?: 'discount' | 'cashback' | 'product' | 'service' | 'badge'
          is_active?: boolean
          external_reward_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      user_rewards: {
        Row: {
          id: string
          user_id: string
          reward_definition_id: string
          status: 'active' | 'redeemed' | 'expired' | 'cancelled'
          points_spent: number
          monetary_value: number
          redeemed_at: string | null
          expires_at: string | null
          external_reward_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_definition_id: string
          status?: 'active' | 'redeemed' | 'expired' | 'cancelled'
          points_spent?: number
          monetary_value?: number
          redeemed_at?: string | null
          expires_at?: string | null
          external_reward_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_definition_id?: string
          status?: 'active' | 'redeemed' | 'expired' | 'cancelled'
          points_spent?: number
          monetary_value?: number
          redeemed_at?: string | null
          expires_at?: string | null
          external_reward_id?: string | null
          created_at?: string
        }
      }

      // Donation system
      donation_campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          target_amount: number | null
          current_amount: number
          start_date: string
          end_date: string | null
          is_active: boolean
          external_campaign_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          target_amount?: number | null
          current_amount?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          external_campaign_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          target_amount?: number | null
          current_amount?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          external_campaign_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      user_donations: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          amount: number
          points_earned: number
          donation_type: 'monetary' | 'points' | 'mixed'
          status: 'pending' | 'confirmed' | 'failed' | 'refunded'
          external_donation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id: string
          amount: number
          points_earned?: number
          donation_type?: 'monetary' | 'points' | 'mixed'
          status?: 'pending' | 'confirmed' | 'failed' | 'refunded'
          external_donation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string
          amount?: number
          points_earned?: number
          donation_type?: 'monetary' | 'points' | 'mixed'
          status?: 'pending' | 'confirmed' | 'failed' | 'refunded'
          external_donation_id?: string | null
          created_at?: string
        }
      }

      // Withdrawal system
      withdrawal_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          withdrawal_method: 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto'
          account_details: any | null
          status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled'
          admin_notes: string | null
          processed_at: string | null
          external_withdrawal_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          withdrawal_method: 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto'
          account_details?: any | null
          status?: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled'
          admin_notes?: string | null
          processed_at?: string | null
          external_withdrawal_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          withdrawal_method?: 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto'
          account_details?: any | null
          status?: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled'
          admin_notes?: string | null
          processed_at?: string | null
          external_withdrawal_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Metrics system
      user_metrics: {
        Row: {
          id: string
          user_id: string
          metric_date: string
          total_recycling_kg: number
          total_points_earned: number
          total_points_spent: number
          total_donations: number
          total_withdrawals: number
          login_count: number
          last_activity: string | null
          external_metrics_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_date: string
          total_recycling_kg?: number
          total_points_earned?: number
          total_points_spent?: number
          total_donations?: number
          total_withdrawals?: number
          login_count?: number
          last_activity?: string | null
          external_metrics_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_date?: string
          total_recycling_kg?: number
          total_points_earned?: number
          total_points_spent?: number
          total_donations?: number
          total_withdrawals?: number
          login_count?: number
          last_activity?: string | null
          external_metrics_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      system_metrics: {
        Row: {
          id: string
          metric_date: string
          metric_type: 'daily' | 'weekly' | 'monthly'
          total_users: number
          active_users: number
          total_recycling_kg: number
          total_points_issued: number
          total_points_redeemed: number
          total_donations: number
          total_withdrawals: number
          external_metrics_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          metric_date: string
          metric_type: 'daily' | 'weekly' | 'monthly'
          total_users?: number
          active_users?: number
          total_recycling_kg?: number
          total_points_issued?: number
          total_points_redeemed?: number
          total_donations?: number
          total_withdrawals?: number
          external_metrics_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          metric_date?: string
          metric_type?: 'daily' | 'weekly' | 'monthly'
          total_users?: number
          active_users?: number
          total_recycling_kg?: number
          total_points_issued?: number
          total_points_redeemed?: number
          total_donations?: number
          total_withdrawals?: number
          external_metrics_id?: string | null
          created_at?: string
        }
      }

      // Pickup photos
      pickup_photos: {
        Row: {
          id: string
          pickup_id: string
          photo_url: string
          photo_type: 'pickup' | 'before' | 'after' | 'damage'
          file_size: number | null
          mime_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pickup_id: string
          photo_url: string
          photo_type?: 'pickup' | 'before' | 'after' | 'damage'
          file_size?: number | null
          mime_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pickup_id?: string
          photo_url?: string
          photo_type?: 'pickup' | 'before' | 'after' | 'damage'
          file_size?: number | null
          mime_type?: string
          created_at?: string
          updated_at?: string
        }
      }

      // Legacy tables (keeping for compatibility)
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

    Views: {
      customer_dashboard_view: {
        Row: {
          pickup_id: string | null
          status: string | null
          total_kg: number | null
          total_value: number | null
          created_at: string | null
          approval_note: string | null
          lat: number | null
          lng: number | null
          customer_id: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          calculated_wallet_balance: number | null
          collector_id: string | null
          collector_name: string | null
          collector_email: string | null
          line1: string | null
          suburb: string | null
          city: string | null
          postal_code: string | null
          material_count: number | null
          calculated_weight: number | null
          calculated_value: number | null
          co2_saved_kg: number | null
          water_saved_liters: number | null
          landfill_saved_kg: number | null
        }
      }

      customer_wallet_balance_view: {
        Row: {
          customer_id: string | null
          full_name: string | null
          email: string | null
          base_balance: number | null
          total_pickup_earnings: number | null
          total_withdrawals: number | null
          total_donations: number | null
          total_rewards_redeemed: number | null
          calculated_current_balance: number | null
          last_wallet_update: string | null
          last_pickup_date: string | null
          last_withdrawal_date: string | null
          last_donation_date: string | null
          last_reward_date: string | null
        }
      }

      customer_metrics_view: {
        Row: {
          customer_id: string | null
          full_name: string | null
          email: string | null
          calculated_wallet_balance: number | null
          total_pickups: number | null
          approved_pickups: number | null
          pending_pickups: number | null
          rejected_pickups: number | null
          total_weight_kg: number | null
          total_earnings: number | null
        }
      }

      customer_performance_summary: {
        Row: {
          customer_id: string | null
          full_name: string | null
          email: string | null
          calculated_wallet_balance: number | null
          month: string | null
          monthly_pickups: number | null
          monthly_weight: number | null
          monthly_earnings: number | null
          monthly_co2_saved: number | null
          monthly_water_saved: number | null
          monthly_landfill_saved: number | null
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
      add_to_sync_queue: {
        Args: {
          p_target_service_id: string
          p_operation_type: string
          p_entity_type: string
          p_entity_id: string
          p_payload: any
          p_priority?: number
        }
        Returns: string
      }
      update_wallet_with_sync: {
        Args: {
          p_user_id: string
          p_balance_change: number
          p_points_change: number
          p_description?: string
        }
        Returns: boolean
      }
      process_sync_queue: {
        Args: {}
        Returns: number
      }
      sync_wallet_balances: {
        Args: {}
        Returns: undefined
      }
      refresh_customer_performance: {
        Args: {}
        Returns: undefined
      }
    }
  }
}
