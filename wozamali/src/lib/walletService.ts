import { supabase } from './supabase';
import { 
  EnhancedWallet, 
  CustomerWalletBalanceView, 
  CustomerMetricsView,
  CustomerDashboardView,
  CustomerPerformanceSummary,
  ApiResponse,
  PaginatedResponse
} from '@/types/rewards';

// Legacy interface for backward compatibility
export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
export interface WalletBalanceView {
  customer_id: string;
  full_name: string;
  email: string;
  base_balance: number;
  total_pickup_earnings: number;
  total_withdrawals: number;
  total_donations: number;
  total_rewards_redeemed: number;
  calculated_current_balance: number;
}

// Legacy interface for backward compatibility
export interface CustomerMetrics {
  customer_id: string;
  full_name: string;
  email: string;
  total_pickups: number;
  approved_pickups: number;
  pending_pickups: number;
  rejected_pickups: number;
  total_weight_kg: number;
  total_earnings: number;
  calculated_wallet_balance: number;
}

export class WalletService {
  // Get enhanced wallet data (new schema)
  static async getEnhancedWallet(userId: string): Promise<EnhancedWallet | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching enhanced wallet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEnhancedWallet:', error);
      return null;
    }
  }

  // Get basic wallet data (legacy - for backward compatibility)
  static async getWallet(userId: string): Promise<WalletData | null> {
    try {
      // First try to get from enhanced_wallets
      const enhancedWallet = await this.getEnhancedWallet(userId);
      if (enhancedWallet) {
        return {
          id: enhancedWallet.id,
          user_id: enhancedWallet.user_id,
          balance: enhancedWallet.balance,
          total_points: enhancedWallet.total_points,
          tier: enhancedWallet.tier,
          created_at: enhancedWallet.created_at,
          updated_at: enhancedWallet.updated_at
        };
      }

      // Fallback to legacy wallets table
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching legacy wallet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWallet:', error);
      return null;
    }
  }

  // Get detailed wallet balance view (new schema)
  static async getWalletBalanceView(userId: string): Promise<CustomerWalletBalanceView | null> {
    try {
      const { data, error } = await supabase
        .from('customer_wallet_balance_view')
        .select('*')
        .eq('customer_id', userId)
        .single();

      if (error) {
        console.error('Error fetching wallet balance view:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWalletBalanceView:', error);
      return null;
    }
  }

  // Get customer metrics (new schema)
  static async getCustomerMetrics(userId: string): Promise<CustomerMetricsView | null> {
    try {
      const { data, error } = await supabase
        .from('customer_metrics_view')
        .select('*')
        .eq('customer_id', userId)
        .single();

      if (error) {
        console.error('Error fetching customer metrics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCustomerMetrics:', error);
      return null;
    }
  }

  // Get customer dashboard data (new schema)
  static async getCustomerDashboard(userId: string): Promise<CustomerDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('customer_dashboard_view')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer dashboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCustomerDashboard:', error);
      return [];
    }
  }

  // Get customer performance summary (new schema)
  static async getCustomerPerformanceSummary(userId: string): Promise<CustomerPerformanceSummary[]> {
    try {
      const { data, error } = await supabase
        .from('customer_performance_summary')
        .select('*')
        .eq('customer_id', userId)
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching customer performance summary:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCustomerPerformanceSummary:', error);
      return [];
    }
  }

  // Subscribe to wallet changes (real-time) - enhanced wallets
  static subscribeToEnhancedWalletChanges(userId: string, callback: (wallet: EnhancedWallet) => void) {
    return supabase
      .channel(`enhanced-wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enhanced_wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as EnhancedWallet);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to wallet changes (real-time) - legacy for backward compatibility
  static subscribeToWalletChanges(userId: string, callback: (wallet: WalletData) => void) {
    return supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enhanced_wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            const enhancedWallet = payload.new as EnhancedWallet;
            // Convert to legacy format
            const legacyWallet: WalletData = {
              id: enhancedWallet.id,
              user_id: enhancedWallet.user_id,
              balance: enhancedWallet.balance,
              total_points: enhancedWallet.total_points,
              tier: enhancedWallet.tier,
              created_at: enhancedWallet.created_at,
              updated_at: enhancedWallet.updated_at
            };
            callback(legacyWallet);
          }
        }
      )
      .subscribe();
  }

  // Create or update enhanced wallet (new schema)
  static async upsertEnhancedWallet(walletData: Partial<EnhancedWallet>): Promise<EnhancedWallet | null> {
    try {
      console.log('WalletService: Attempting to upsert enhanced wallet:', walletData);
      
      const { data, error } = await supabase
        .from('enhanced_wallets')
        .upsert(walletData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting enhanced wallet:', error);
        if (error.code === '42P01') {
          console.error('Table "enhanced_wallets" does not exist. Please run the database schema first.');
        }
        return null;
      }

      console.log('WalletService: Successfully upserted enhanced wallet:', data);
      return data;
    } catch (error) {
      console.error('Error in upsertEnhancedWallet:', error);
      return null;
    }
  }

  // Create or update wallet (legacy - for backward compatibility)
  static async upsertWallet(walletData: Partial<WalletData>): Promise<WalletData | null> {
    try {
      // Convert to enhanced wallet format
      const enhancedWalletData: Partial<EnhancedWallet> = {
        user_id: walletData.user_id!,
        balance: walletData.balance,
        total_points: walletData.total_points,
        tier: walletData.tier,
        sync_status: 'synced'
      };

      const enhancedWallet = await this.upsertEnhancedWallet(enhancedWalletData);
      if (enhancedWallet) {
        return {
          id: enhancedWallet.id,
          user_id: enhancedWallet.user_id,
          balance: enhancedWallet.balance,
          total_points: enhancedWallet.total_points,
          tier: enhancedWallet.tier,
          created_at: enhancedWallet.created_at,
          updated_at: enhancedWallet.updated_at
        };
      }

      return null;
    } catch (error) {
      console.error('Error in upsertWallet:', error);
      return null;
    }
  }

  // Update wallet with sync (new schema function)
  static async updateWalletWithSync(
    userId: string, 
    balanceChange: number, 
    pointsChange: number, 
    description?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_wallet_with_sync', {
        p_user_id: userId,
        p_balance_change: balanceChange,
        p_points_change: pointsChange,
        p_description: description
      });

      if (error) {
        console.error('Error updating wallet with sync:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in updateWalletWithSync:', error);
      return false;
    }
  }

  // Sync wallet balances (new schema function)
  static async syncWalletBalances(): Promise<void> {
    try {
      const { error } = await supabase.rpc('sync_wallet_balances');
      if (error) {
        console.error('Error syncing wallet balances:', error);
      }
    } catch (error) {
      console.error('Error in syncWalletBalances:', error);
    }
  }

  // Refresh customer performance (new schema function)
  static async refreshCustomerPerformance(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_customer_performance');
      if (error) {
        console.error('Error refreshing customer performance:', error);
      }
    } catch (error) {
      console.error('Error in refreshCustomerPerformance:', error);
    }
  }

  // Get environmental impact for a user
  static async getEnvironmentalImpact(userId: string): Promise<{
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
    trees_equivalent: number;
  } | null> {
    try {
      const dashboardData = await this.getCustomerDashboard(userId);
      
      if (dashboardData.length === 0) {
        return {
          co2_saved_kg: 0,
          water_saved_liters: 0,
          landfill_saved_kg: 0,
          trees_equivalent: 0
        };
      }

      const totalCo2 = dashboardData.reduce((sum, item) => sum + (item.co2_saved_kg || 0), 0);
      const totalWater = dashboardData.reduce((sum, item) => sum + (item.water_saved_liters || 0), 0);
      const totalLandfill = dashboardData.reduce((sum, item) => sum + (item.landfill_saved_kg || 0), 0);
      
      // Calculate trees equivalent (roughly 1 tree = 22 kg CO2 absorbed per year)
      const treesEquivalent = totalCo2 / 22;

      return {
        co2_saved_kg: totalCo2,
        water_saved_liters: totalWater,
        landfill_saved_kg: totalLandfill,
        trees_equivalent: treesEquivalent
      };
    } catch (error) {
      console.error('Error in getEnvironmentalImpact:', error);
      return null;
    }
  }

  // Get tier benefits
  static getTierBenefits(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string[] {
    const benefits = {
      bronze: [
        'Basic recycling rewards',
        'Access to standard rewards',
        'Monthly progress reports'
      ],
      silver: [
        'Enhanced recycling rewards',
        'Priority customer support',
        'Exclusive silver-tier rewards',
        'Quarterly impact reports'
      ],
      gold: [
        'Premium recycling rewards',
        'VIP customer support',
        'Exclusive gold-tier rewards',
        'Monthly impact reports',
        'Early access to new features'
      ],
      platinum: [
        'Maximum recycling rewards',
        'Dedicated customer support',
        'Exclusive platinum-tier rewards',
        'Weekly impact reports',
        'Beta feature access',
        'Community recognition'
      ]
    };

    return benefits[tier] || benefits.bronze;
  }

  // Calculate next tier requirements
  static getNextTierRequirements(currentTier: 'bronze' | 'silver' | 'gold' | 'platinum', currentPoints: number): {
    nextTier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
    pointsNeeded: number;
    progressPercentage: number;
  } {
    const tierThresholds = {
      bronze: 0,
      silver: 100,
      gold: 500,
      platinum: 1000
    };

    const tiers: ('bronze' | 'silver' | 'gold' | 'platinum')[] = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === tiers.length - 1) {
      return {
        nextTier: null,
        pointsNeeded: 0,
        progressPercentage: 100
      };
    }

    const nextTier = tiers[currentIndex + 1];
    const currentThreshold = tierThresholds[currentTier];
    const nextThreshold = tierThresholds[nextTier];
    const pointsNeeded = nextThreshold - currentPoints;
    const progressPercentage = Math.min(100, ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

    return {
      nextTier,
      pointsNeeded: Math.max(0, pointsNeeded),
      progressPercentage: Math.max(0, Math.min(100, progressPercentage))
    };
  }
}
