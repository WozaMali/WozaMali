// Correct Wallet Service - Implements the proper business rule
// PET Bottles: 0% to user wallet (100% to Green Scholar Fund)
// Everything else: 100% to user wallet

import { supabase } from './supabase';

export interface CorrectWalletData {
  user_id: string;
  full_name: string;
  email: string;
  correct_balance: number;
  total_points: number;
  tier: string;
  total_collections: number;
  approved_collections: number;
  pet_bottles_value: number;
  other_materials_value: number;
  total_withdrawals: number;
}

export class CorrectWalletService {
  /**
   * Get correct wallet balance for a user based on the business rule
   */
  static async getCorrectWalletBalance(userId: string): Promise<CorrectWalletData | null> {
    try {
      console.log('CorrectWalletService: Getting correct wallet balance for user:', userId);
      
      const { data, error } = await supabase.rpc('get_correct_user_wallet_balance', {
        p_user_id: userId
      });

      if (error) {
        console.error('CorrectWalletService: Error getting correct wallet balance:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('CorrectWalletService: No wallet data found for user');
        return null;
      }

      const walletData = data[0];
      console.log('CorrectWalletService: Correct wallet data:', walletData);
      
      return walletData;
    } catch (error) {
      console.error('CorrectWalletService: Unexpected error:', error);
      return null;
    }
  }

  /**
   * Update wallet with correct balance
   */
  static async updateWalletWithCorrectBalance(userId: string): Promise<boolean> {
    try {
      console.log('CorrectWalletService: Updating wallet with correct balance for user:', userId);
      
      const { data, error } = await supabase.rpc('update_wallet_with_correct_balance', {
        p_user_id: userId
      });

      if (error) {
        console.error('CorrectWalletService: Error updating wallet:', error);
        return false;
      }

      console.log('CorrectWalletService: Wallet updated successfully:', data);
      return true;
    } catch (error) {
      console.error('CorrectWalletService: Unexpected error updating wallet:', error);
      return false;
    }
  }

  /**
   * Get wallet data with correct balance calculation (fallback method)
   * This method calculates the balance directly without using the database function
   */
  static async getWalletDataDirect(userId: string): Promise<CorrectWalletData | null> {
    try {
      console.log('CorrectWalletService: Getting wallet data directly for user:', userId);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('CorrectWalletService: Error fetching profile:', profileError);
        return null;
      }

      // Get approved collections with material details
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select(`
          id,
          status,
          pickup_items!inner(
            quantity,
            total_price,
            material_id,
            materials!inner(
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (collectionsError) {
        console.error('CorrectWalletService: Error fetching collections:', collectionsError);
        return null;
      }

      // Calculate values
      let petBottlesValue = 0;
      let otherMaterialsValue = 0;
      let totalWeight = 0;
      let totalCollections = 0;
      let approvedCollections = 0;

      if (collections) {
        totalCollections = collections.length;
        approvedCollections = collections.filter(c => c.status === 'approved').length;

        collections.forEach(collection => {
          if (collection.pickup_items) {
            collection.pickup_items.forEach((item: any) => {
              const materialName = item.materials?.name?.toLowerCase() || '';
              const isPet = materialName.includes('pet') || materialName.includes('plastic');
              
              totalWeight += item.quantity || 0;
              
              if (isPet) {
                petBottlesValue += item.total_price || 0;
              } else {
                otherMaterialsValue += item.total_price || 0;
              }
            });
          }
        });
      }

      // Get total withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', userId)
        .in('status', ['approved', 'processing', 'completed']);

      let totalWithdrawals = 0;
      if (!withdrawalsError && withdrawals) {
        totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      }

      // Calculate correct balance (only non-PET materials minus withdrawals)
      const correctBalance = Math.max(0, otherMaterialsValue - totalWithdrawals);

      // Calculate tier
      const tier = this.calculateTier(totalWeight);

      const walletData: CorrectWalletData = {
        user_id: userId,
        full_name: profile.full_name || 'User',
        email: profile.email || '',
        correct_balance: correctBalance,
        total_points: Math.floor(totalWeight),
        tier: tier,
        total_collections: totalCollections,
        approved_collections: approvedCollections,
        pet_bottles_value: petBottlesValue,
        other_materials_value: otherMaterialsValue,
        total_withdrawals: totalWithdrawals
      };

      console.log('CorrectWalletService: Direct wallet calculation result:', walletData);
      return walletData;
    } catch (error) {
      console.error('CorrectWalletService: Unexpected error in direct calculation:', error);
      return null;
    }
  }

  /**
   * Calculate tier based on total weight
   */
  private static calculateTier(totalWeight: number): string {
    if (totalWeight >= 1000) return 'platinum';
    if (totalWeight >= 500) return 'gold';
    if (totalWeight >= 250) return 'silver';
    if (totalWeight >= 100) return 'bronze';
    return 'bronze';
  }

  /**
   * Update all users' wallets with correct balances
   */
  static async updateAllUsersWallets(): Promise<{ success: number; errors: number }> {
    try {
      console.log('CorrectWalletService: Updating all users wallets with correct balances');
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError || !users) {
        console.error('CorrectWalletService: Error fetching users:', usersError);
        return { success: 0, errors: 1 };
      }

      let success = 0;
      let errors = 0;

      // Update each user's wallet
      for (const user of users) {
        try {
          const updated = await this.updateWalletWithCorrectBalance(user.id);
          if (updated) {
            success++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`CorrectWalletService: Error updating wallet for user ${user.id}:`, error);
          errors++;
        }
      }

      console.log(`CorrectWalletService: Updated ${success} wallets, ${errors} errors`);
      return { success, errors };
    } catch (error) {
      console.error('CorrectWalletService: Unexpected error updating all wallets:', error);
      return { success: 0, errors: 1 };
    }
  }
}
