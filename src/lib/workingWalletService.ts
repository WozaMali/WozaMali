import { supabase } from './supabase';
import { calculateTotalCollectionValue, getTierFromWeight } from './material-pricing';

export interface WorkingWalletData {
  id: string;
  user_id: string;
  current_points: number;
  total_points_earned: number;
  total_points_spent: number;
  last_updated: string;
  tier?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
}

export interface CollectionSummary {
  total_pickups: number;
  total_materials_kg: number;
  total_value: number;
  total_points_earned: number;
}

export interface WorkingWalletInfo {
  wallet: WorkingWalletData | null;
  profile: UserProfile | null;
  collectionSummary: CollectionSummary;
  tier: string;
  balance: number;
  points: number;
  totalWeightKg: number;
  environmentalImpact: {
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
  };
  nextTierRequirements: {
    nextTier: string | null;
    weightNeeded: number;
    progressPercentage: number;
  };
}

export class WorkingWalletService {
  // Cache for wallet data to prevent repeated queries
  private static cache = new Map<string, { data: WorkingWalletInfo; timestamp: number }>();
  private static CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // Cache for transaction history
  private static transactionCache = new Map<string, { data: any[]; timestamp: number }>();
  private static TRANSACTION_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

  static async getWalletData(userId: string): Promise<WorkingWalletInfo> {
    try {
      console.log('WorkingWalletService: Fetching wallet data for user:', userId);
      
      if (!userId) {
        console.error('WorkingWalletService: No userId provided');
        return this.getEmptyWalletInfo();
      }

      // Check cache first
      const cached = this.cache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('WorkingWalletService: Using cached data');
        return cached.data;
      }

      // Get user data from auth.users
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || user.id !== userId) {
        console.error('WorkingWalletService: Auth error or user mismatch:', authError);
        return this.getEmptyWalletInfo();
      }

      // Create profile from auth user data
      const profile: UserProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: user.user_metadata?.phone || null,
        role: 'member',
        status: 'active',
        created_at: user.created_at,
        last_login: user.last_sign_in_at || null
      };

      // Get collections data with a single optimized query
      const { data: collections, error: collectionsError } = await supabase
        .from('unified_collections')
        .select(`
          id,
          total_value,
          total_weight_kg,
          status,
          created_at
        `)
        .eq('customer_id', userId)
        .in('status', ['approved', 'completed']);

      if (collectionsError) {
        console.error('WorkingWalletService: Error fetching collections:', collectionsError);
        return this.getEmptyWalletInfo();
      }

      // Calculate totals
      const approvedCollections = collections || [];
      const totalWeight = approvedCollections.reduce((sum, c) => sum + (c.total_weight_kg || 0), 0);
      const totalValue = approvedCollections.reduce((sum, c) => sum + (c.total_value || 0), 0);
      const totalPickups = approvedCollections.length;

      // Get withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', userId)
        .in('status', ['approved', 'processing', 'completed']);

      const totalWithdrawals = (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0);

      // Calculate final balance
      const balance = Math.max(0, totalValue - totalWithdrawals);
      const points = Math.floor(totalWeight);
      const tier = getTierFromWeight(totalWeight);

      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: totalWeight * 0.5,
        water_saved_liters: totalWeight * 2,
        landfill_saved_kg: totalWeight * 0.8
      };

      // Calculate next tier requirements
      const nextTierRequirements = this.calculateNextTierRequirements(totalWeight);

      // Create wallet data
      const walletData: WorkingWalletData = {
        id: user.id,
        user_id: userId,
        current_points: points,
        total_points_earned: points,
        total_points_spent: 0,
        last_updated: new Date().toISOString(),
        tier: tier
      };

      // Create collection summary
      const collectionSummary: CollectionSummary = {
        total_pickups: totalPickups,
        total_materials_kg: totalWeight,
        total_value: totalValue,
        total_points_earned: points
      };

      const result: WorkingWalletInfo = {
        wallet: walletData,
        profile: profile,
        collectionSummary: collectionSummary,
        tier: tier,
        balance: balance,
        points: points,
        totalWeightKg: totalWeight,
        environmentalImpact: environmentalImpact,
        nextTierRequirements: nextTierRequirements
      };

      // Cache the result
      this.cache.set(userId, { data: result, timestamp: Date.now() });

      console.log('WorkingWalletService: Wallet data calculated:', {
        balance,
        totalValue,
        totalWithdrawals,
        totalWeight,
        totalPickups,
        tier
      });

      return result;

    } catch (error) {
      console.error('WorkingWalletService: Error fetching wallet data:', error);
      return this.getEmptyWalletInfo();
    }
  }

  static async refreshWalletData(userId: string): Promise<WorkingWalletInfo> {
    // Clear cache before refreshing
    this.cache.delete(userId);
    return this.getWalletData(userId);
  }

  static clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get transaction history for a user (optimized version)
   * Returns recent transactions only, with caching
   */
  static async getTransactionHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      console.log('WorkingWalletService: Fetching transaction history for user:', userId);
      
      if (!userId) {
        console.error('WorkingWalletService: No userId provided for transaction history');
        return [];
      }

      // Check cache first
      const cached = this.transactionCache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < this.TRANSACTION_CACHE_DURATION) {
        console.log('WorkingWalletService: Using cached transaction history');
        return cached.data.slice(0, limit);
      }

      // Simplified query - only get recent transactions
      const { data: transactions, error } = await supabase
        .from('unified_collections')
        .select(`
          id,
          collection_code,
          total_value,
          total_weight_kg,
          status,
          created_at,
          updated_at,
          customer_id,
          customer_email
        `)
        .eq('customer_id', userId)
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more than needed for better caching

      if (error) {
        console.error('WorkingWalletService: Error fetching transactions:', error);
        return [];
      }

      // Convert to transaction format
      const transactionList = (transactions || []).map((tx: any) => ({
        id: tx.id,
        type: 'credit',
        amount: Number(tx.total_value || 0),
        description: 'Collection approved',
        material_type: 'Mixed Materials',
        kgs: Number(tx.total_weight_kg || 0),
        status: tx.status,
        created_at: tx.created_at,
        approved_at: tx.updated_at || tx.created_at,
        updated_at: tx.updated_at || tx.created_at,
        reference: tx.collection_code
      }));

      // Cache the result
      this.transactionCache.set(userId, { data: transactionList, timestamp: Date.now() });

      return transactionList.slice(0, limit);

    } catch (error) {
      console.error('WorkingWalletService: Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Clear transaction cache
   */
  static clearTransactionCache(userId?: string): void {
    if (userId) {
      this.transactionCache.delete(userId);
    } else {
      this.transactionCache.clear();
    }
  }

  static async getNonPetApprovedTotal(userId: string): Promise<number> {
    try {
      if (!userId) return 0;
      
      // Simplified query - just get the total value from collections
      const { data: collections } = await supabase
        .from('unified_collections')
        .select('total_value')
        .eq('customer_id', userId)
        .in('status', ['approved', 'completed']);

      const total = (collections || []).reduce((sum, c) => sum + (c.total_value || 0), 0);
      return Number(total.toFixed(2));
    } catch (_e) {
      return 0;
    }
  }

  private static calculateNextTierRequirements(currentWeightKg: number) {
    if (currentWeightKg >= 500) {
      return { nextTier: null, weightNeeded: 0, progressPercentage: 100 };
    }
    if (currentWeightKg >= 300) {
      const weightNeeded = 500 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 500) * 100;
      return { nextTier: 'diamond', weightNeeded, progressPercentage };
    }
    if (currentWeightKg >= 150) {
      const weightNeeded = 300 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 300) * 100;
      return { nextTier: 'platinum', weightNeeded, progressPercentage };
    }
    if (currentWeightKg >= 50) {
      const weightNeeded = 150 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 150) * 100;
      return { nextTier: 'gold', weightNeeded, progressPercentage };
    }
    const weightNeeded = 50 - currentWeightKg;
    const progressPercentage = (currentWeightKg / 50) * 100;
    return { nextTier: 'silver', weightNeeded, progressPercentage };
  }

  private static getEmptyWalletInfo(): WorkingWalletInfo {
    return {
      wallet: null,
      profile: null,
      collectionSummary: {
        total_pickups: 0,
        total_materials_kg: 0,
        total_value: 0,
        total_points_earned: 0
      },
      tier: 'bronze',
      balance: 0,
      points: 0,
      totalWeightKg: 0,
      environmentalImpact: {
        co2_saved_kg: 0,
        water_saved_liters: 0,
        landfill_saved_kg: 0
      },
      nextTierRequirements: {
        nextTier: 'silver',
        weightNeeded: 50,
        progressPercentage: 0
      }
    };
  }
}