/**
 * Unified Rewards Service
 * Handles CRUD operations for rewards system across all apps
 * Connects to the unified collections system for points calculation
 */

import { supabase } from './supabase';

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  category: 'cash' | 'service' | 'product' | 'voucher';
  is_active: boolean;
  logo_url?: string;
  redeem_url?: string;
  order_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRewardData {
  name: string;
  description: string;
  points_required: number;
  category: 'cash' | 'service' | 'product' | 'voucher';
  is_active?: boolean;
  logo_url?: string;
  redeem_url?: string;
  order_url?: string;
}

export interface UpdateRewardData {
  name?: string;
  description?: string;
  points_required?: number;
  category?: 'cash' | 'service' | 'product' | 'voucher';
  is_active?: boolean;
  logo_url?: string;
  redeem_url?: string;
  order_url?: string;
}

/**
 * Get all active rewards (for Main App)
 */
export async function getActiveRewards(): Promise<{ data: Reward[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching active rewards:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getActiveRewards:', error);
    return { data: null, error };
  }
}

/**
 * Get all rewards (for Office App)
 */
export async function getAllRewards(): Promise<{ data: Reward[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rewards:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAllRewards:', error);
    return { data: null, error };
  }
}

/**
 * Get rewards by category
 */
export async function getRewardsByCategory(category: string): Promise<{ data: Reward[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching rewards by category:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getRewardsByCategory:', error);
    return { data: null, error };
  }
}

/**
 * Get user's available rewards based on their points
 */
export async function getAvailableRewards(userPoints: number): Promise<{ data: Reward[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .lte('points_required', userPoints)
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching available rewards:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAvailableRewards:', error);
    return { data: null, error };
  }
}

/**
 * Create a new reward (Office App only)
 */
export async function createReward(rewardData: CreateRewardData): Promise<{ data: Reward | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .insert([{
        ...rewardData,
        is_active: rewardData.is_active ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in createReward:', error);
    return { data: null, error };
  }
}

/**
 * Update a reward (Office App only)
 */
export async function updateReward(rewardId: string, rewardData: UpdateRewardData): Promise<{ data: Reward | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update({
        ...rewardData,
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in updateReward:', error);
    return { data: null, error };
  }
}

/**
 * Delete a reward (Office App only)
 */
export async function deleteReward(rewardId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in deleteReward:', error);
    return { success: false, error };
  }
}

/**
 * Toggle reward active status (Office App only)
 */
export async function toggleRewardStatus(rewardId: string, isActive: boolean): Promise<{ data: Reward | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling reward status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception in toggleRewardStatus:', error);
    return { data: null, error };
  }
}