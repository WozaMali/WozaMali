import { supabase } from './supabase';
import { 
  RewardDefinition, 
  UserReward, 
  DonationCampaign, 
  UserDonation, 
  WithdrawalRequest,
  ApiResponse,
  PaginatedResponse,
  RewardRedemptionForm,
  DonationForm,
  WithdrawalForm
} from '@/types/rewards';

export class RewardsService {
  // ============================================================================
  // REWARD DEFINITIONS
  // ============================================================================

  // Get all active reward definitions
  static async getActiveRewards(): Promise<RewardDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('reward_definitions')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) {
        console.error('Error fetching active rewards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveRewards:', error);
      return [];
    }
  }

  // Get reward definition by ID
  static async getRewardDefinition(rewardId: string): Promise<RewardDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('reward_definitions')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (error) {
        console.error('Error fetching reward definition:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getRewardDefinition:', error);
      return null;
    }
  }

  // Get rewards by type
  static async getRewardsByType(rewardType: 'discount' | 'cashback' | 'product' | 'service' | 'badge'): Promise<RewardDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('reward_definitions')
        .select('*')
        .eq('is_active', true)
        .eq('reward_type', rewardType)
        .order('points_cost', { ascending: true });

      if (error) {
        console.error('Error fetching rewards by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRewardsByType:', error);
      return [];
    }
  }

  // ============================================================================
  // USER REWARDS
  // ============================================================================

  // Get user's active rewards
  static async getUserRewards(userId: string): Promise<UserReward[]> {
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward_definitions (
            id,
            name,
            description,
            reward_type,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user rewards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRewards:', error);
      return [];
    }
  }

  // Get user's reward history
  static async getUserRewardHistory(userId: string): Promise<UserReward[]> {
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward_definitions (
            id,
            name,
            description,
            reward_type,
            is_active
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reward history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRewardHistory:', error);
      return [];
    }
  }

  // Redeem a reward
  static async redeemReward(rewardData: RewardRedemptionForm): Promise<UserReward | null> {
    try {
      // First, get the reward definition to check points cost
      const rewardDefinition = await this.getRewardDefinition(rewardData.reward_definition_id);
      if (!rewardDefinition) {
        throw new Error('Reward definition not found');
      }

      // Create the user reward record
      const { data, error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: rewardData.user_id,
          reward_definition_id: rewardData.reward_definition_id,
          status: 'active',
          points_spent: rewardDefinition.points_cost,
          monetary_value: rewardDefinition.monetary_value,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (error) {
        console.error('Error redeeming reward:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in redeemReward:', error);
      return null;
    }
  }

  // Mark reward as redeemed
  static async markRewardAsRedeemed(rewardId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (error) {
        console.error('Error marking reward as redeemed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markRewardAsRedeemed:', error);
      return false;
    }
  }

  // ============================================================================
  // DONATION CAMPAIGNS
  // ============================================================================

  // Get all active donation campaigns
  static async getActiveDonationCampaigns(): Promise<DonationCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('donation_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donation campaigns:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveDonationCampaigns:', error);
      return [];
    }
  }

  // Get donation campaign by ID
  static async getDonationCampaign(campaignId: string): Promise<DonationCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('donation_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching donation campaign:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDonationCampaign:', error);
      return null;
    }
  }

  // ============================================================================
  // USER DONATIONS
  // ============================================================================

  // Get user's donations
  static async getUserDonations(userId: string): Promise<UserDonation[]> {
    try {
      const { data, error } = await supabase
        .from('user_donations')
        .select(`
          *,
          donation_campaigns (
            id,
            name,
            description,
            target_amount,
            current_amount
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user donations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserDonations:', error);
      return [];
    }
  }

  // Create a new donation
  static async createDonation(donationData: DonationForm): Promise<UserDonation | null> {
    try {
      // Calculate points earned (1 point per R1 donated)
      const pointsEarned = Math.floor(donationData.amount);

      const { data, error } = await supabase
        .from('user_donations')
        .insert({
          user_id: donationData.user_id || '', // This should be passed from the form
          campaign_id: donationData.campaign_id,
          amount: donationData.amount,
          points_earned: pointsEarned,
          donation_type: donationData.donation_type,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating donation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDonation:', error);
      return null;
    }
  }

  // ============================================================================
  // WITHDRAWAL REQUESTS
  // ============================================================================

  // Get user's withdrawal requests
  static async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user withdrawals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserWithdrawals:', error);
      return [];
    }
  }

  // Create a new withdrawal request
  static async createWithdrawalRequest(withdrawalData: WithdrawalForm): Promise<WithdrawalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: withdrawalData.user_id || '', // This should be passed from the form
          amount: withdrawalData.amount,
          withdrawal_method: withdrawalData.withdrawal_method,
          account_details: withdrawalData.account_details,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating withdrawal request:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createWithdrawalRequest:', error);
      return null;
    }
  }

  // Cancel a withdrawal request
  static async cancelWithdrawalRequest(withdrawalId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) {
        console.error('Error cancelling withdrawal request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in cancelWithdrawalRequest:', error);
      return false;
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  // Subscribe to reward changes
  static subscribeToRewardChanges(userId: string, callback: (reward: UserReward) => void) {
    return supabase
      .channel(`user-rewards-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rewards',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserReward);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to donation changes
  static subscribeToDonationChanges(userId: string, callback: (donation: UserDonation) => void) {
    return supabase
      .channel(`user-donations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_donations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserDonation);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to withdrawal changes
  static subscribeToWithdrawalChanges(userId: string, callback: (withdrawal: WithdrawalRequest) => void) {
    return supabase
      .channel(`user-withdrawals-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as WithdrawalRequest);
          }
        }
      )
      .subscribe();
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Calculate donation progress
  static calculateDonationProgress(campaign: DonationCampaign): {
    percentage: number;
    remaining: number;
    isComplete: boolean;
  } {
    if (!campaign.target_amount) {
      return {
        percentage: 0,
        remaining: 0,
        isComplete: false
      };
    }

    const percentage = Math.min(100, (campaign.current_amount / campaign.target_amount) * 100);
    const remaining = Math.max(0, campaign.target_amount - campaign.current_amount);
    const isComplete = campaign.current_amount >= campaign.target_amount;

    return {
      percentage: Math.round(percentage),
      remaining: Math.round(remaining * 100) / 100,
      isComplete
    };
  }

  // Format reward type for display
  static formatRewardType(rewardType: string): string {
    const typeMap: Record<string, string> = {
      discount: 'Discount',
      cashback: 'Cashback',
      product: 'Product',
      service: 'Service',
      badge: 'Badge'
    };

    return typeMap[rewardType] || rewardType;
  }

  // Format withdrawal method for display
  static formatWithdrawalMethod(method: string): string {
    const methodMap: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      mobile_money: 'Mobile Money',
      paypal: 'PayPal',
      crypto: 'Cryptocurrency'
    };

    return methodMap[method] || method;
  }

  // Get reward icon based on type
  static getRewardIcon(rewardType: string): string {
    const iconMap: Record<string, string> = {
      discount: '🎯',
      cashback: '💰',
      product: '🎁',
      service: '🔧',
      badge: '🏆'
    };

    return iconMap[rewardType] || '🎁';
  }

  // Get withdrawal method icon
  static getWithdrawalMethodIcon(method: string): string {
    const iconMap: Record<string, string> = {
      bank_transfer: '🏦',
      mobile_money: '📱',
      paypal: '💳',
      crypto: '₿'
    };

    return iconMap[method] || '💳';
  }
}
