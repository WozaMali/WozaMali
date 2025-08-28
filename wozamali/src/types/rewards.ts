// WozaMali Rewards and Metrics System Types
// These types correspond to the rewards-metrics-system schema in Supabase

// ============================================================================
// CORE TYPES
// ============================================================================

export interface ExternalService {
  id: string;
  service_name: string;
  service_type: 'wallet' | 'rewards' | 'analytics' | 'payment' | 'notification';
  base_url: string;
  api_key_hash?: string;
  webhook_url?: string;
  is_active: boolean;
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceApiKey {
  id: string;
  service_id: string;
  key_name: string;
  key_hash: string;
  permissions: Record<string, any>;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  target_service_id: string;
  operation_type: 'wallet_update' | 'points_update' | 'reward_issue' | 'donation_create' | 'withdrawal_request' | 'metrics_update';
  entity_type: 'wallet' | 'user' | 'transaction' | 'reward' | 'donation' | 'withdrawal' | 'metric';
  entity_id: string;
  payload: Record<string, any>;
  priority: number;
  retry_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  error_message?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WALLET SYSTEM TYPES
// ============================================================================

export interface EnhancedWallet {
  id: string;
  user_id: string;
  balance: number;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  external_wallet_id?: string;
  last_sync_at?: string;
  sync_status: 'synced' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface WalletSyncHistory {
  id: string;
  wallet_id: string;
  sync_type: 'push' | 'pull' | 'full_sync';
  external_service_id: string;
  old_balance?: number;
  new_balance?: number;
  old_points?: number;
  new_points?: number;
  sync_result: 'success' | 'partial' | 'failed';
  error_details?: string;
  created_at: string;
}

// ============================================================================
// REWARDS SYSTEM TYPES
// ============================================================================

export interface RewardDefinition {
  id: string;
  reward_code: string;
  name: string;
  description?: string;
  points_cost: number;
  monetary_value: number;
  reward_type: 'discount' | 'cashback' | 'product' | 'service' | 'badge';
  is_active: boolean;
  external_reward_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_definition_id: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  points_spent: number;
  monetary_value: number;
  redeemed_at?: string;
  expires_at?: string;
  external_reward_id?: string;
  created_at: string;
}

// ============================================================================
// DONATIONS SYSTEM TYPES
// ============================================================================

export interface DonationCampaign {
  id: string;
  name: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  external_campaign_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDonation {
  id: string;
  user_id: string;
  campaign_id: string;
  amount: number;
  points_earned: number;
  donation_type: 'monetary' | 'points' | 'mixed';
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  external_donation_id?: string;
  created_at: string;
}

// ============================================================================
// WITHDRAWALS SYSTEM TYPES
// ============================================================================

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  withdrawal_method: 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto';
  account_details?: Record<string, any>;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  admin_notes?: string;
  processed_at?: string;
  external_withdrawal_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// METRICS AND ANALYTICS TYPES
// ============================================================================

export interface UserMetrics {
  id: string;
  user_id: string;
  metric_date: string;
  total_recycling_kg: number;
  total_points_earned: number;
  total_points_spent: number;
  total_donations: number;
  total_withdrawals: number;
  login_count: number;
  last_activity?: string;
  external_metrics_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  id: string;
  metric_date: string;
  metric_type: 'daily' | 'weekly' | 'monthly';
  total_users: number;
  active_users: number;
  total_recycling_kg: number;
  total_points_issued: number;
  total_points_redeemed: number;
  total_donations: number;
  total_withdrawals: number;
  external_metrics_id?: string;
  created_at: string;
}

// ============================================================================
// PICKUP PHOTOS TYPES
// ============================================================================

export interface PickupPhoto {
  id: string;
  pickup_id: string;
  photo_url: string;
  photo_type: 'pickup' | 'before' | 'after' | 'damage';
  file_size?: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WEBHOOKS AND NOTIFICATIONS TYPES
// ============================================================================

export interface WebhookEndpoint {
  id: string;
  service_id: string;
  endpoint_url: string;
  events: string[];
  is_active: boolean;
  secret_key_hash?: string;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  delivery_time_ms?: number;
  success: boolean;
  retry_count: number;
  created_at: string;
}

// ============================================================================
// VIEW TYPES (Database Views)
// ============================================================================

export interface CustomerDashboardView {
  pickup_id?: string;
  status?: string;
  total_kg?: number;
  total_value?: number;
  created_at?: string;
  approval_note?: string;
  lat?: number;
  lng?: number;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  calculated_wallet_balance?: number;
  collector_id?: string;
  collector_name?: string;
  collector_email?: string;
  line1?: string;
  suburb?: string;
  city?: string;
  postal_code?: string;
  material_count?: number;
  calculated_weight?: number;
  calculated_value?: number;
  co2_saved_kg?: number;
  water_saved_liters?: number;
  landfill_saved_kg?: number;
}

export interface CustomerWalletBalanceView {
  customer_id?: string;
  full_name?: string;
  email?: string;
  base_balance?: number;
  total_pickup_earnings?: number;
  total_withdrawals?: number;
  total_donations?: number;
  total_rewards_redeemed?: number;
  calculated_current_balance?: number;
  last_wallet_update?: string;
  last_pickup_date?: string;
  last_withdrawal_date?: string;
  last_donation_date?: string;
  last_reward_date?: string;
}

export interface CustomerMetricsView {
  customer_id?: string;
  full_name?: string;
  email?: string;
  calculated_wallet_balance?: number;
  total_pickups?: number;
  approved_pickups?: number;
  pending_pickups?: number;
  rejected_pickups?: number;
  total_weight_kg?: number;
  total_earnings?: number;
}

export interface CustomerPerformanceSummary {
  customer_id?: string;
  full_name?: string;
  email?: string;
  calculated_wallet_balance?: number;
  month?: string;
  monthly_pickups?: number;
  monthly_weight?: number;
  monthly_earnings?: number;
  monthly_co2_saved?: number;
  monthly_water_saved?: number;
  monthly_landfill_saved?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface RewardRedemptionForm {
  reward_definition_id: string;
  user_id: string;
}

export interface DonationForm {
  campaign_id: string;
  amount: number;
  donation_type: 'monetary' | 'points' | 'mixed';
}

export interface WithdrawalForm {
  amount: number;
  withdrawal_method: 'bank_transfer' | 'mobile_money' | 'paypal' | 'crypto';
  account_details?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TierBenefits {
  bronze: string[];
  silver: string[];
  gold: string[];
  platinum: string[];
}

export interface EnvironmentalImpact {
  co2_saved_kg: number;
  water_saved_liters: number;
  landfill_saved_kg: number;
  trees_equivalent: number;
}

export interface RewardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIER_NAMES = {
  bronze: 'Bronze Recycler',
  silver: 'Silver Recycler',
  gold: 'Gold Recycler',
  platinum: 'Platinum Recycler'
} as const;

export const REWARD_TYPES = {
  discount: 'Discount',
  cashback: 'Cashback',
  product: 'Product',
  service: 'Service',
  badge: 'Badge'
} as const;

export const WITHDRAWAL_METHODS = {
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  paypal: 'PayPal',
  crypto: 'Cryptocurrency'
} as const;

export const DONATION_TYPES = {
  monetary: 'Monetary',
  points: 'Points',
  mixed: 'Mixed'
} as const;

export const SYNC_STATUSES = {
  synced: 'Synced',
  pending: 'Pending',
  failed: 'Failed'
} as const;

export const REWARD_STATUSES = {
  active: 'Active',
  redeemed: 'Redeemed',
  expired: 'Expired',
  cancelled: 'Cancelled'
} as const;

export const WITHDRAWAL_STATUSES = {
  pending: 'Pending',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
} as const;

export const DONATION_STATUSES = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
  refunded: 'Refunded'
} as const;
