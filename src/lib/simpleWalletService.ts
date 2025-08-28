import { supabase } from './supabase';

export interface SimpleWalletData {
  id: string;
  user_id: string;
  balance: number;
  total_points: number;
  tier: string;
  sync_status?: string;
  created_at: string;
  updated_at: string;
}

export class SimpleWalletService {
  static async getWalletData(userId: string): Promise<SimpleWalletData | null> {
    try {
      console.log('SimpleWalletService: Fetching wallet data for user:', userId);
      
      if (!userId) {
        console.error('SimpleWalletService: No userId provided');
        return null;
      }

      // First, try to get from the wallets table
      let { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('SimpleWalletService: Error fetching from wallets table:', error);
        
        // If no wallet found, try to create one
        if (error.code === 'PGRST116') {
          console.log('SimpleWalletService: No wallet found, creating one...');
          return await this.ensureWallet(userId);
        }
        
        // If it's a different error, try the enhanced_wallets table as fallback
        console.log('SimpleWalletService: Trying enhanced_wallets table as fallback...');
        const enhancedResult = await supabase
          .from('enhanced_wallets')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (enhancedResult.data) {
          console.log('SimpleWalletService: Found wallet in enhanced_wallets:', enhancedResult.data);
          return enhancedResult.data;
        }
        
        // If still no wallet, create one
        return await this.ensureWallet(userId);
      }

      console.log('SimpleWalletService: Wallet data received from wallets table:', data);
      return data;
    } catch (error) {
      console.error('SimpleWalletService: Unexpected error:', error);
      
      // Return a fallback wallet to prevent UI errors
      return this.createFallbackWallet(userId);
    }
  }

  static async ensureWallet(userId: string): Promise<SimpleWalletData | null> {
    try {
      console.log('SimpleWalletService: Ensuring wallet exists for user:', userId);
      
      // Try to create wallet in the wallets table first
      try {
        const defaultWallet = {
          user_id: userId,
          balance: 50.00,
          total_points: 50,
          tier: 'bronze'
        };

        const { data, error } = await supabase
          .from('wallets')
          .insert(defaultWallet)
          .select()
          .single();

        if (!error && data) {
          console.log('SimpleWalletService: Default wallet created in wallets table:', data);
          return data;
        }
      } catch (walletError) {
        console.log('SimpleWalletService: Could not create wallet in wallets table, trying enhanced_wallets:', walletError);
      }

      // Try enhanced_wallets table as fallback
      try {
        const defaultEnhancedWallet = {
          user_id: userId,
          balance: 50.00,
          total_points: 50,
          tier: 'bronze',
          sync_status: 'synced'
        };

        const { data, error } = await supabase
          .from('enhanced_wallets')
          .insert(defaultEnhancedWallet)
          .select()
          .single();

        if (!error && data) {
          console.log('SimpleWalletService: Default wallet created in enhanced_wallets table:', data);
          return data;
        }
      } catch (enhancedError) {
        console.log('SimpleWalletService: Could not create wallet in enhanced_wallets table:', enhancedError);
      }

      // If all else fails, return a fallback wallet
      console.log('SimpleWalletService: Returning fallback wallet');
      return this.createFallbackWallet(userId);
      
    } catch (error) {
      console.error('SimpleWalletService: Error ensuring wallet:', error);
      return this.createFallbackWallet(userId);
    }
  }

  private static createFallbackWallet(userId: string): SimpleWalletData {
    console.log('SimpleWalletService: Creating fallback wallet for user:', userId);
    
    return {
      id: `fallback-${userId}`,
      user_id: userId,
      balance: 50.00,
      total_points: 50,
      tier: 'bronze',
      sync_status: 'fallback',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateBalance(userId: string, newBalance: number, newPoints: number): Promise<boolean> {
    try {
      // Try to update in wallets table first
      let { error } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          total_points: newPoints,
          tier: this.calculateTier(newPoints),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.log('SimpleWalletService: Could not update wallets table, trying enhanced_wallets:', error);
        
        // Try enhanced_wallets table as fallback
        const enhancedResult = await supabase
          .from('enhanced_wallets')
          .update({
            balance: newBalance,
            total_points: newPoints,
            tier: this.calculateTier(newPoints),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (enhancedResult.error) {
          console.error('SimpleWalletService: Error updating both wallet tables:', enhancedResult.error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('SimpleWalletService: Error updating wallet:', error);
      return false;
    }
  }

  private static calculateTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    return 'bronze';
  }

  // Method to check if wallet tables exist
  static async checkWalletTables(): Promise<{ wallets: boolean; enhanced_wallets: boolean }> {
    try {
      const [walletsCheck, enhancedCheck] = await Promise.all([
        supabase.from('wallets').select('id').limit(1),
        supabase.from('enhanced_wallets').select('id').limit(1)
      ]);

      return {
        wallets: !walletsCheck.error,
        enhanced_wallets: !enhancedCheck.error
      };
    } catch (error) {
      console.error('SimpleWalletService: Error checking wallet tables:', error);
      return { wallets: false, enhanced_wallets: false };
    }
  }
}
