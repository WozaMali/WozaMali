import { supabase } from './supabase';

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  cashValue: number;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  reward?: Reward;
  pointsUsed: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardCategory {
  name: string;
  count: number;
}

export class RewardsService {
  /**
   * Get all active rewards
   */
  static async getRewards(category?: string): Promise<Reward[]> {
    try {
      console.log('RewardsService: Fetching rewards...', { category });

      let query = supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching rewards:', error);
        throw error;
      }

      const rewards: Reward[] = data?.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        category: reward.category,
        pointsCost: reward.points_cost,
        cashValue: reward.cash_value,
        imageUrl: reward.image_url,
        isActive: reward.is_active,
        stockQuantity: reward.stock_quantity,
        createdAt: reward.created_at,
        updatedAt: reward.updated_at
      })) || [];

      console.log('RewardsService: Rewards fetched successfully:', rewards.length);
      return rewards;

    } catch (error) {
      console.error('RewardsService: Error fetching rewards:', error);
      throw error;
    }
  }

  /**
   * Get reward by ID
   */
  static async getRewardById(rewardId: string): Promise<Reward | null> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Reward not found
        }
        console.error('Error fetching reward:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        pointsCost: data.points_cost,
        cashValue: data.cash_value,
        imageUrl: data.image_url,
        isActive: data.is_active,
        stockQuantity: data.stock_quantity,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

    } catch (error) {
      console.error('RewardsService: Error fetching reward:', error);
      throw error;
    }
  }

  /**
   * Get reward categories
   */
  static async getRewardCategories(): Promise<RewardCategory[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('category')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching reward categories:', error);
        throw error;
      }

      // Count rewards by category
      const categoryCounts = data?.reduce((acc, reward) => {
        const category = reward.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count
      }));

    } catch (error) {
      console.error('RewardsService: Error fetching reward categories:', error);
      throw error;
    }
  }

  /**
   * Redeem a reward
   */
  static async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    try {
      console.log('RewardsService: Redeeming reward:', { userId, rewardId });

      // First, get the reward details
      const reward = await this.getRewardById(rewardId);
      if (!reward) {
        throw new Error('Reward not found');
      }

      // Check if user has enough points
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (walletError) {
        console.error('Error fetching user wallet:', walletError);
        throw walletError;
      }

      if (!wallet || wallet.total_points < reward.pointsCost) {
        throw new Error('Insufficient points to redeem this reward');
      }

      // Check stock availability
      if (reward.stockQuantity !== null && reward.stockQuantity <= 0) {
        throw new Error('This reward is out of stock');
      }

      // Create redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_used: reward.pointsCost,
          status: 'pending'
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Error creating redemption:', redemptionError);
        throw redemptionError;
      }

      // Deduct points from user's wallet
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({
          total_points: supabase.sql`total_points - ${reward.pointsCost}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (walletUpdateError) {
        console.error('Error updating wallet:', walletUpdateError);
        throw walletUpdateError;
      }

      // Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          source_type: 'reward_redemption',
          source_id: redemption.id,
          amount: 0, // No cash amount for point redemptions
          points: -reward.pointsCost, // Negative points (deduction)
          description: `Redeemed reward: ${reward.name}`
        });

      if (transactionError) {
        console.error('Error creating wallet transaction:', transactionError);
        throw transactionError;
      }

      // Update stock quantity if applicable
      if (reward.stockQuantity !== null) {
        const { error: stockError } = await supabase
          .from('rewards')
          .update({
            stock_quantity: supabase.sql`stock_quantity - 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', rewardId);

        if (stockError) {
          console.error('Error updating stock:', stockError);
          // Don't throw here as the redemption was successful
        }
      }

      const result: RewardRedemption = {
        id: redemption.id,
        userId: redemption.user_id,
        rewardId: redemption.reward_id,
        reward: reward,
        pointsUsed: redemption.points_used,
        status: redemption.status,
        notes: redemption.notes,
        createdAt: redemption.created_at,
        updatedAt: redemption.updated_at
      };

      console.log('RewardsService: Reward redeemed successfully:', result);
      return result;

    } catch (error) {
      console.error('RewardsService: Error redeeming reward:', error);
      throw error;
    }
  }

  /**
   * Get user's redemption history
   */
  static async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards (
            id,
            name,
            description,
            category,
            points_cost,
            cash_value,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user redemptions:', error);
        throw error;
      }

      return data?.map(redemption => ({
        id: redemption.id,
        userId: redemption.user_id,
        rewardId: redemption.reward_id,
        reward: redemption.rewards ? {
          id: redemption.rewards.id,
          name: redemption.rewards.name,
          description: redemption.rewards.description,
          category: redemption.rewards.category,
          pointsCost: redemption.rewards.points_cost,
          cashValue: redemption.rewards.cash_value,
          imageUrl: redemption.rewards.image_url,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        } : undefined,
        pointsUsed: redemption.points_used,
        status: redemption.status,
        notes: redemption.notes,
        createdAt: redemption.created_at,
        updatedAt: redemption.updated_at
      })) || [];

    } catch (error) {
      console.error('RewardsService: Error fetching user redemptions:', error);
      throw error;
    }
  }

  /**
   * Get all redemptions (admin function)
   */
  static async getAllRedemptions(status?: string): Promise<RewardRedemption[]> {
    try {
      let query = supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards (
            id,
            name,
            description,
            category,
            points_cost,
            cash_value,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all redemptions:', error);
        throw error;
      }

      return data?.map(redemption => ({
        id: redemption.id,
        userId: redemption.user_id,
        rewardId: redemption.reward_id,
        reward: redemption.rewards ? {
          id: redemption.rewards.id,
          name: redemption.rewards.name,
          description: redemption.rewards.description,
          category: redemption.rewards.category,
          pointsCost: redemption.rewards.points_cost,
          cashValue: redemption.rewards.cash_value,
          imageUrl: redemption.rewards.image_url,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        } : undefined,
        pointsUsed: redemption.points_used,
        status: redemption.status,
        notes: redemption.notes,
        createdAt: redemption.created_at,
        updatedAt: redemption.updated_at
      })) || [];

    } catch (error) {
      console.error('RewardsService: Error fetching all redemptions:', error);
      throw error;
    }
  }

  /**
   * Update redemption status (admin function)
   */
  static async updateRedemptionStatus(
    redemptionId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'fulfilled',
    notes?: string
  ): Promise<RewardRedemption> {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', redemptionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating redemption status:', error);
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        rewardId: data.reward_id,
        pointsUsed: data.points_used,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

    } catch (error) {
      console.error('RewardsService: Error updating redemption status:', error);
      throw error;
    }
  }
}
