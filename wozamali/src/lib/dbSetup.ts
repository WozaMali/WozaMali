import { supabase } from './supabase';

export class DatabaseSetup {
  // Check if enhanced_wallets table exists
  static async checkTablesExist(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('enhanced_wallets')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('Enhanced wallets table does not exist:', error);
        return false;
      }
      
      console.log('Enhanced wallets table exists');
      return true;
    } catch (error) {
      console.error('Error checking tables:', error);
      return false;
    }
  }

  // Create a wallet for a user if it doesn't exist
  static async ensureUserWallet(userId: string): Promise<boolean> {
    try {
      console.log('Ensuring wallet exists for user:', userId);
      
      // Check if user already has an enhanced wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('enhanced_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing wallet:', fetchError);
        return false;
      }

      if (existingWallet) {
        console.log('User already has wallet:', existingWallet);
        return true;
      }

      // Create new wallet
      const { data: newWallet, error: createError } = await supabase
        .from('enhanced_wallets')
        .insert({
          user_id: userId,
          balance: 100.00, // Give user R100 starting balance for testing
          total_points: 50, // Give user 50 starting points for testing
          tier: 'bronze',
          sync_status: 'synced'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return false;
      }

      console.log('Created new wallet for user:', newWallet);
      return true;
    } catch (error) {
      console.error('Error in ensureUserWallet:', error);
      return false;
    }
  }

  // Initialize test data for development
  static async initializeTestData(userId: string): Promise<void> {
    try {
      console.log('Initializing test data for user:', userId);
      
      // Ensure wallet exists
      await this.ensureUserWallet(userId);

      // Add some test metrics data if user_metrics view exists
      const { error: metricsError } = await supabase
        .from('user_metrics')
        .select('count', { count: 'exact', head: true });

      if (!metricsError) {
        console.log('User metrics table exists - test data setup would go here');
      }

      console.log('Test data initialization complete');
    } catch (error) {
      console.error('Error initializing test data:', error);
    }
  }

  // Test database connectivity
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }
}
