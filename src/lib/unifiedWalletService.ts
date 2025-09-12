// Unified Wallet Service for Main App
// Provides real-time access to wallet data and balance updates

import { supabase } from './supabase';
const DISABLE_WALLET_FEATURES =
  (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_DISABLE_WALLET_FEATURES === 'true');
import { calculateTotalCollectionValue, getTierFromWeight, calculateCollectionValue } from './material-pricing';

export interface UnifiedWalletData {
  wallet_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  balance: number;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  total_earnings: number;
  total_weight_kg: number;
  environmental_impact: {
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
    trees_equivalent: number;
  };
  last_updated: string;
  recent_transactions: number;
  next_tier: string | null;
  points_to_next_tier: number;
}

export interface WalletUpdateRequest {
  user_id: string;
  balance_change: number;
  points_change: number;
  transaction_type: 'collection' | 'withdrawal' | 'transfer' | 'reward' | 'penalty' | 'bonus' | 'adjustment';
  description?: string;
  reference_id?: string;
}

export interface CollectionSummary {
  total_collections: number;
  completed_collections: number;
  pending_collections: number;
  total_weight_kg: number;
  total_value: number;
  total_points: number;
}

export class UnifiedWalletService {
  /**
   * Get live wallet data for a user
   */
  static async getWalletData(userId: string): Promise<UnifiedWalletData | null> {
    try {
      console.log('UnifiedWalletService: Fetching wallet data for user:', userId);
      
      if (!userId) {
        console.error('UnifiedWalletService: No userId provided');
        return null;
      }

      // Get wallet data from wallets table (Main App schema)
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, total_points, tier, last_updated')
        .eq('user_id', userId)
        .single();

      if (walletError) {
        console.error('UnifiedWalletService: Error fetching wallet data:', walletError);
        
        // If no wallet found, try to create one
        if (walletError.code === 'PGRST116') {
          console.log('UnifiedWalletService: No wallet found, creating one...');
          return await this.ensureWallet(userId);
        }
        
        return null;
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('UnifiedWalletService: Error fetching profile data:', profileError);
      }

      // Get collection summary
      const collectionSummary = await this.getCollectionSummary(userId);

      // Calculate tier based on weight (not points)
      const tier = getTierFromWeight(collectionSummary?.total_weight_kg || 0);
      
      // Use total_value from collection summary as the primary balance source
      const balanceFromCollections = collectionSummary?.total_value || 0;

      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: (collectionSummary?.total_weight_kg || 0) * 2.5,
        water_saved_liters: (collectionSummary?.total_weight_kg || 0) * 100,
        landfill_saved_kg: (collectionSummary?.total_weight_kg || 0) * 0.8,
        trees_equivalent: (collectionSummary?.total_weight_kg || 0) * 0.1
      };

      // Calculate next tier requirements based on weight
      const nextTierRequirements = this.getNextTierRequirementsByWeight(collectionSummary?.total_weight_kg || 0);

      const result: UnifiedWalletData = {
        wallet_id: userId, // Use user_id as wallet_id for wallets table
        user_id: userId,
        full_name: profileData?.full_name || 'User',
        email: profileData?.email || '',
        phone: profileData?.phone || '',
        balance: balanceFromCollections || walletData.balance, // Use collections balance first, fallback to wallets table
        total_points: walletData.total_points, // Use total_points from wallets table
        tier: tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
        total_earnings: walletData.total_points, // Use total_points as earnings
        total_weight_kg: collectionSummary?.total_weight_kg || 0,
        environmental_impact: environmentalImpact,
        last_updated: walletData.last_updated,
        recent_transactions: 0, // Would need to query transactions table
        next_tier: nextTierRequirements.nextTier,
        points_to_next_tier: nextTierRequirements.pointsNeeded
      };

      console.log('UnifiedWalletService: Wallet data received:', result);
      return result;
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error:', error);
      return null;
    }
  }

  /**
   * Ensure wallet exists for user
   */
  static async ensureWallet(userId: string): Promise<UnifiedWalletData | null> {
    try {
      // First check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('UnifiedWalletService: User profile not found:', profileError);
        return null;
      }

      // Create wallet if it doesn't exist (Main App schema)
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0.00,
          total_points: 0,
          tier: 'bronze'
        })
        .select()
        .single();

      if (walletError) {
        console.error('UnifiedWalletService: Error creating wallet:', walletError);
        return null;
      }

      // Return the wallet data in the expected format
      return {
        wallet_id: wallet.id,
        user_id: userId,
        full_name: profile.full_name,
        email: profile.email || '',
        phone: profile.phone || '',
        balance: 0,
        total_points: 0,
        tier: 'bronze',
        total_earnings: 0,
        total_weight_kg: 0,
        environmental_impact: {
          co2_saved_kg: 0,
          water_saved_liters: 0,
          landfill_saved_kg: 0,
          trees_equivalent: 0
        },
        last_updated: wallet.last_updated,
        recent_transactions: 0,
        next_tier: 'silver',
        points_to_next_tier: 50 // 50kg to reach silver tier
      };
    } catch (error) {
      console.error('UnifiedWalletService: Error ensuring wallet:', error);
      return null;
    }
  }

  /**
   * Update wallet balance and points using Office App RPC function
   */
  static async updateWalletBalance(request: WalletUpdateRequest): Promise<boolean> {
    try {
      if (DISABLE_WALLET_FEATURES) {
        console.log('UnifiedWalletService: Wallet features disabled (collector app). Skipping update.');
        return true;
      }
      console.log('UnifiedWalletService: Updating wallet balance:', request);

      // Use the same RPC function as the Office App
      const { data, error } = await supabase.rpc('update_wallet_simple', {
        p_user_id: request.user_id,
        p_amount: request.balance_change,
        p_transaction_type: request.transaction_type,
        p_weight_kg: request.points_change, // Points = Weight in this system
        p_description: request.description || null,
        p_reference_id: request.reference_id || null
      });

      if (error) {
        console.error('UnifiedWalletService: Error updating wallet balance:', error);
        return false;
      }

      console.log('UnifiedWalletService: Wallet balance updated successfully:', data);
      return data?.success || false;
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error updating wallet:', error);
      return false;
    }
  }

  /**
   * Process collection payment (called when collection is approved)
   */
  static async processCollectionPayment(collectionId: string): Promise<boolean> {
    try {
      if (DISABLE_WALLET_FEATURES) {
        console.log('UnifiedWalletService: Wallet features disabled (collector app). Skipping collection payment processing.');
        return true;
      }
      console.log('UnifiedWalletService: Processing collection payment for:', collectionId);

      // Get collection details first
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('user_id, weight_kg')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        console.error('UnifiedWalletService: Error fetching collection:', collectionError);
        return false;
      }

      // Use the same RPC function as the Office App
      const { data, error } = await supabase.rpc('update_wallet_simple', {
        p_user_id: collection.user_id,
        p_amount: 0, // No cash amount in this system
        p_transaction_type: 'collection_approval',
        p_weight_kg: collection.weight_kg,
        p_description: `Collection approved - ${collection.weight_kg}kg recycled`,
        p_reference_id: collectionId
      });

      if (error) {
        console.error('UnifiedWalletService: Error processing collection payment:', error);
        return false;
      }

      console.log('UnifiedWalletService: Collection payment processed successfully:', data);
      return data?.success || false;
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error processing collection payment:', error);
      return false;
    }
  }

  /**
   * Get collection summary for a user
   */
  static async getCollectionSummary(userId: string): Promise<CollectionSummary | null> {
    try {
      // Use collections table instead of pickups table for consistency with Office App
      const { data: collections, error } = await supabase
        .from('collections')
        .select('weight_kg, total_value, status, created_at, user_id')
        .eq('user_id', userId);

      if (error) {
        console.error('UnifiedWalletService: Error fetching collection summary:', error);
        return null;
      }

      if (!collections || collections.length === 0) {
        return {
          total_collections: 0,
          completed_collections: 0,
          pending_collections: 0,
          total_weight_kg: 0,
          total_value: 0,
          total_points: 0
        };
      }

      // Calculate summary from collections data
      const totalWeight = collections.reduce((sum, collection) => sum + (collection.weight_kg || 0), 0);
      const completedCollections = collections.filter(c => c.status === 'approved').length;
      const pendingCollections = collections.filter(c => c.status === 'pending').length;
      
      // Calculate total value from approved collections
      const approvedCollections = collections.filter(c => c.status === 'approved');
      const totalValue = approvedCollections.reduce((sum, collection) => sum + (collection.total_value || 0), 0);

      return {
        total_collections: collections.length,
        completed_collections: completedCollections,
        pending_collections: pendingCollections,
        total_weight_kg: totalWeight,
        total_value: totalValue,
        total_points: 0 // Will be read from user_wallets table
      };
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error fetching collection summary:', error);
      return null;
    }
  }

  /**
   * Get wallet transactions for a user
   */
  static async getWalletTransactions(userId: string, limit?: number): Promise<any[]> {
    try {
      // Use user_id filter to be compatible with both schemas
      let txQuery = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (typeof limit === 'number' && isFinite(limit) && limit > 0) {
        txQuery = txQuery.limit(limit);
      }

      const { data: txns, error: txErr } = await txQuery;

      if (txErr) {
        console.error('UnifiedWalletService: Error fetching transactions by wallet_id:', txErr);
        return [];
      }

      return txns || [];
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Build resident transactions from collections/pickups data
   * Matches the Office App source of truth for earnings
   */
  static async getResidentTransactionsFromCollections(userId: string): Promise<any[]> {
    try {
      // Try collections (Office App path)
      const { data: collections } = await supabase
        .from('collections')
        .select('id, user_id, material_type, weight_kg, status, created_at, updated_at, collection_date')
        .eq('user_id', userId)
        .eq('status', 'approved');

      // Collect distinct material names to fetch rates
      const materialNames = Array.from(new Set((collections || [])
        .map(c => String(c.material_type || '').trim().toLowerCase())
        .filter(Boolean)));

      // Ensure Aluminum Cans is included for default pickup rate
      if (!materialNames.includes('aluminum cans')) materialNames.push('aluminum cans');

      const { data: materials } = await supabase
        .from('materials')
        .select('name, unit_price')
        .in('name', materialNames);

      const nameToRate = new Map<string, number>(
        (materials || []).map((m: any) => [String(m.name).toLowerCase(), Number(m.unit_price) || 0])
      );

      const collectionTx = (collections || []).map((c: any) => {
        const weight = Number(c.weight_kg) || 0;
        const materialName = String(c.material_type || '').trim();
        const rate = nameToRate.get(materialName.toLowerCase()) ?? 0;
        const value = Number((weight * rate).toFixed(2));
        return {
          id: `col-${c.id}`,
          user_id: c.user_id,
          transaction_type: 'collection',
          source_type: 'collection_approval',
          amount: value,
          material: materialName || 'Unknown',
          weight_kg: weight,
          rate_per_kg: rate,
          description: materialName ? `${materialName} collection` : 'Collection approved',
          created_at: c.updated_at || c.collection_date || c.created_at,
          status: c.status || 'approved'
        };
      });

      // Try pickups (alternate path in main app)
      const { data: pickups } = await supabase
        .from('pickups')
        .select('id, user_id, weight_kg, status, created_at, updated_at, pickup_date')
        .eq('user_id', userId)
        .eq('status', 'approved');

      // Default to Aluminum Cans rate if material unknown on pickups
      const defaultAluRate = nameToRate.get('aluminum cans') ?? 18.55;

      const pickupTx = (pickups || []).map((p: any) => {
        const weight = Number(p.weight_kg) || 0;
        const rate = defaultAluRate;
        const value = Number((weight * rate).toFixed(2));
        return {
          id: `pk-${p.id}`,
          user_id: p.user_id,
          transaction_type: 'collection',
          source_type: 'collection_approval',
          amount: value,
          material: 'Aluminum Cans',
          weight_kg: weight,
          rate_per_kg: rate,
          description: 'Collection approved',
          created_at: p.updated_at || p.pickup_date || p.created_at,
          status: p.status || 'approved'
        };
      });

      const combined = [...collectionTx, ...pickupTx]
        .filter(t => t.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return combined;
    } catch (error) {
      console.error('UnifiedWalletService: Error building transactions from collections:', error);
      return [];
    }
  }

  /**
   * Get points history for a user
   */
  static async getPointsHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('UnifiedWalletService: Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('UnifiedWalletService: Unexpected error fetching points history:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time wallet updates
   */
  static subscribeToWalletUpdates(userId: string, callback: (payload: any) => void) {
    if (DISABLE_WALLET_FEATURES) {
      // Return a dummy subscription-like object
      return { unsubscribe: () => {} } as any;
    }
    return supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time collection updates
   */
  static subscribeToCollectionUpdates(userId: string, callback: (payload: any) => void) {
    if (DISABLE_WALLET_FEATURES) {
      // Return a dummy subscription-like object
      return { unsubscribe: () => {} } as any;
    }
    return supabase
      .channel('collection-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Calculate tier benefits
   */
  static getTierBenefits(tier: string): string[] {
    switch (tier) {
      case 'platinum':
        return [
          'Priority pickup scheduling',
          'Exclusive rewards',
          'VIP customer support',
          'Special event invitations',
          'Higher earning rates'
        ];
      case 'gold':
        return [
          'Faster pickup scheduling',
          'Enhanced rewards',
          'Priority customer support',
          'Bonus points on collections'
        ];
      case 'silver':
        return [
          'Standard pickup scheduling',
          'Regular rewards',
          'Standard customer support'
        ];
      default:
        return [
          'Basic pickup scheduling',
          'Basic rewards',
          'Standard customer support'
        ];
    }
  }

  /**
   * Calculate tier based on points
   */
  private static calculateTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    return 'bronze';
  }

  /**
   * Calculate next tier requirements based on weight
   */
  static getNextTierRequirementsByWeight(currentWeightKg: number) {
    if (currentWeightKg >= 500) {
      return { nextTier: null, pointsNeeded: 0, progressPercentage: 100 };
    }
    if (currentWeightKg >= 300) {
      const weightNeeded = 500 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 500) * 100;
      return { nextTier: 'diamond', pointsNeeded: weightNeeded, progressPercentage };
    }
    if (currentWeightKg >= 150) {
      const weightNeeded = 300 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 300) * 100;
      return { nextTier: 'platinum', pointsNeeded: weightNeeded, progressPercentage };
    }
    if (currentWeightKg >= 50) {
      const weightNeeded = 150 - currentWeightKg;
      const progressPercentage = (currentWeightKg / 150) * 100;
      return { nextTier: 'gold', pointsNeeded: weightNeeded, progressPercentage };
    }
    const weightNeeded = 50 - currentWeightKg;
    const progressPercentage = (currentWeightKg / 50) * 100;
    return { nextTier: 'silver', pointsNeeded: weightNeeded, progressPercentage };
  }
}

