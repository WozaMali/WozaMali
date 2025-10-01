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

      // Get user data from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          full_name, 
          phone, 
          role_id, 
          status,
          created_at
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (userError || !userData) {
        console.error('WorkingWalletService: Error fetching user data:', userError);
        return this.getEmptyWalletInfo();
      }

      // Create profile from public.users table data
      const profile: UserProfile = {
        id: userData.id,
        user_id: userData.id,
        email: userData.email || '',
        full_name: userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email?.split('@')[0] || 'User',
        phone: userData.phone || null,
        role: 'member',
        status: userData.status || 'active',
        created_at: userData.created_at,
        last_login: null
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
        .in('status', ['approved', 'processing', 'processed', 'completed']);

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
        id: userData.id,
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

      // Get collections with material details from unified_collections
      const { data: collections, error: colError } = await supabase
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
          customer_email,
          material_count,
          collection_type
        `)
        .eq('customer_id', userId)
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more than needed for better caching

      if (colError) {
        console.error('WorkingWalletService: Error fetching collections:', colError);
      }

      // Fetch withdrawals to include as debits
      console.log('WorkingWalletService: Fetching withdrawals for user:', userId);
      
      // First, let's check if there are any withdrawals at all for this user
      const { data: allWithdrawals, error: allWdError } = await supabase
        .from('withdrawal_requests')
        .select('id, user_id, amount, status, created_at')
        .eq('user_id', userId);
      
      console.log('WorkingWalletService: All withdrawals for user:', { 
        count: allWithdrawals?.length || 0, 
        error: allWdError,
        withdrawals: allWithdrawals?.map(w => ({ id: w.id, user_id: w.user_id, amount: w.amount, status: w.status }))
      });
      
      const { data: withdrawals, error: wdError } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          amount,
          status,
          created_at,
          updated_at,
          processed_at
        `)
        .eq('user_id', userId)
        .in('status', ['pending', 'approved', 'processing', 'processed', 'completed'])
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      console.log('WorkingWalletService: Withdrawal query result:', { 
        count: withdrawals?.length || 0, 
        error: wdError,
        withdrawals: withdrawals?.map(w => ({ id: w.id, amount: w.amount, status: w.status }))
      });

      if (wdError) {
        console.error('WorkingWalletService: Error fetching withdrawals:', wdError);
      }

      // Convert collections to transaction format (credits)
      console.log('WorkingWalletService: Processing collections:', collections?.length || 0);
      const collectionList = (collections || []).map((tx: any) => {
        // Use material information from unified_collections
        let materialNames = 'Recyclable Materials'; // Default fallback
        
        // Use collection_type as the primary material identifier
        if (tx.collection_type && tx.collection_type !== 'null' && tx.collection_type.trim() !== '') {
          // Capitalize and format the collection type
          materialNames = tx.collection_type.charAt(0).toUpperCase() + tx.collection_type.slice(1);
        } else if (tx.material_count && tx.material_count > 0) {
          materialNames = `${tx.material_count} Material${tx.material_count > 1 ? 's' : ''}`;
        }
        
        console.log('WorkingWalletService: Using material info for collection', tx.id, ':', {
          collection_type: tx.collection_type,
          material_count: tx.material_count,
          final_material: materialNames
        });

        return {
          id: tx.id,
          type: 'credit', // earning
          transaction_type: 'collection', // Add transaction_type for History component
          source_type: 'collection_approval', // Add source_type for History component
          amount: Number(tx.total_value || 0),
          description: 'Collection approved',
          material_type: materialNames,
          kgs: Number(tx.total_weight_kg || 0),
          status: tx.status,
          created_at: tx.created_at,
          approved_at: tx.updated_at || tx.created_at,
          updated_at: tx.updated_at || tx.created_at,
          reference: tx.collection_code
        };
      });

      // Convert withdrawals to transaction format (debits)
      console.log('WorkingWalletService: Processing withdrawals:', withdrawals?.length || 0);
      const withdrawalList = (withdrawals || []).map((wd: any) => ({
        id: wd.id,
        type: 'debit', // withdrawal
        transaction_type: 'withdrawal', // Add transaction_type for History component
        source_type: 'withdrawal_request', // Add source_type for History component
        amount: -Math.abs(Number(wd.amount || 0)),
        description: 'Withdrawal',
        material_type: null,
        kgs: 0,
        status: wd.status,
        created_at: wd.created_at,
        approved_at: wd.processed_at || wd.updated_at || wd.created_at,
        updated_at: wd.updated_at || wd.created_at,
        reference: wd.id
      }));

      // Merge, sort by most recent effective date, and limit
      console.log('WorkingWalletService: Merging transactions - collections:', collectionList.length, 'withdrawals:', withdrawalList.length);
      const merged = [...collectionList, ...withdrawalList].sort((a, b) => {
        const ad = new Date(a.approved_at || a.updated_at || a.created_at).getTime();
        const bd = new Date(b.approved_at || b.updated_at || b.created_at).getTime();
        return bd - ad;
      });

      // Cache the result
      this.transactionCache.set(userId, { data: merged, timestamp: Date.now() });

      return merged.slice(0, limit);

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