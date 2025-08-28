import { supabase } from './supabase';

export interface SimpleWalletData {
  user_id: string;
  balance: number;
  total_points: number;
  tier: string;
  sync_status: string;
}

export class SimpleWalletService {
  // Direct, simple method to get wallet data
  static async getWalletData(userId: string): Promise<SimpleWalletData | null> {
    try {
      console.log('SimpleWalletService: Fetching wallet for user:', userId);
      
      const { data, error } = await supabase
        .from('enhanced_wallets')
        .select('user_id, balance, total_points, tier, sync_status')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('SimpleWalletService: Error fetching wallet:', error);
        return null;
      }

      console.log('SimpleWalletService: Successfully fetched wallet:', data);
      return data;
    } catch (error) {
      console.error('SimpleWalletService: Exception in getWalletData:', error);
      return null;
    }
  }

  // Create wallet if it doesn't exist
  static async ensureWallet(userId: string): Promise<SimpleWalletData | null> {
    try {
      console.log('SimpleWalletService: Ensuring wallet exists for user:', userId);
      
      // First try to get existing wallet
      let wallet = await this.getWalletData(userId);
      
      if (wallet) {
        console.log('SimpleWalletService: Wallet already exists:', wallet);
        return wallet;
      }

      // Create new wallet if none exists
      console.log('SimpleWalletService: Creating new wallet for user:', userId);
      
      const { data, error } = await supabase
        .from('enhanced_wallets')
        .insert({
          user_id: userId,
          balance: 100.00, // Default starting balance
          total_points: 100,
          tier: 'bronze',
          sync_status: 'synced'
        })
        .select('user_id, balance, total_points, tier, sync_status')
        .single();

      if (error) {
        console.error('SimpleWalletService: Error creating wallet:', error);
        return null;
      }

      console.log('SimpleWalletService: Successfully created wallet:', data);
      return data;
    } catch (error) {
      console.error('SimpleWalletService: Exception in ensureWallet:', error);
      return null;
    }
  }

  // Update wallet balance
  static async updateBalance(userId: string, newBalance: number, newPoints: number): Promise<boolean> {
    try {
      console.log('SimpleWalletService: Updating balance for user:', userId, 'to:', newBalance);
      
      const { error } = await supabase
        .from('enhanced_wallets')
        .update({
          balance: newBalance,
          total_points: newPoints,
          tier: this.calculateTier(newPoints),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('SimpleWalletService: Error updating balance:', error);
        return false;
      }

      console.log('SimpleWalletService: Successfully updated balance');
      return true;
    } catch (error) {
      console.error('SimpleWalletService: Exception in updateBalance:', error);
      return false;
    }
  }

  // Calculate tier based on points
  private static calculateTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  }
}
