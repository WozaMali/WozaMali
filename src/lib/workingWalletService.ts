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
  static async getWalletData(userId: string): Promise<WorkingWalletInfo> {
    try {
      console.log('WorkingWalletService: Fetching wallet data for user:', userId);
      
      if (!userId) {
        console.error('WorkingWalletService: No userId provided');
        return this.getEmptyWalletInfo();
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

      console.log('WorkingWalletService: Found user profile from auth');

      // Try to get data from unified schema first
      let walletData: WorkingWalletData | null = null;
      let collectionSummary: CollectionSummary;
      
      try {
        console.log('WorkingWalletService: Fetching from unified schema...');
        
        // Try to get wallet data from unified user_wallets table
        const { data: walletTableData, error: walletError } = await supabase
          .from('user_wallets')
          .select('current_points, total_points_earned, total_points_spent')
          .eq('user_id', userId)
          .single();
          
        console.log('WorkingWalletService: Wallet data from unified user_wallets table:', {
          walletTableData,
          walletError,
          hasWalletData: !!walletTableData,
          currentPoints: walletTableData?.current_points,
          totalPointsEarned: walletTableData?.total_points_earned,
          errorMessage: walletError?.message
        });
        
        // Try to get collection data from existing collections table
        const { data: pickupsData, error: pickupsError } = await supabase
          .from('collections')
          .select('weight_kg, status, created_at, collection_date')
          .eq('user_id', userId);
          
        console.log('WorkingWalletService: Collections data from unified schema:', {
          pickupsData,
          pickupsError,
          hasPickups: !!pickupsData && pickupsData.length > 0,
          totalPickups: pickupsData?.length || 0,
          errorMessage: pickupsError?.message
        });
        
        // Calculate totals from collections data
        const totalWeight = pickupsData?.reduce((sum, pickup) => sum + (pickup.weight_kg || 0), 0) || 0;
        const totalPickups = pickupsData?.length || 0;
        const completedPickups = pickupsData?.filter(p => p.status === 'approved' || p.status === 'completed').length || 0;
        const pendingPickups = pickupsData?.filter(p => p.status === 'pending' || p.status === 'submitted').length || 0;
        
        // Use data from unified schema
        const pointsBalance = walletTableData?.current_points || 0;
        const totalPointsEarned = walletTableData?.total_points_earned || 0;

        // Prefer Main App wallets.balance if available; fallback to points-based conversion
        let moneyBalance = pointsBalance * 0.01; // Convert points to money (1 point = R0.01)
        try {
          const { data: mainWallet, error: mainWalletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();
          if (!mainWalletError && mainWallet && typeof mainWallet.balance === 'number') {
            moneyBalance = mainWallet.balance;
          }
        } catch (e) {
          // Ignore and keep fallback
        }
        const tier = getTierFromWeight(totalWeight);
        
        // Create wallet data from unified schema
        const walletDataObj = {
          id: user.id,
          user_id: userId,
          current_points: pointsBalance,
          total_points_earned: totalPointsEarned,
          total_points_spent: walletTableData?.total_points_spent || 0,
          last_updated: new Date().toISOString(),
          tier: tier
        };
        
        // Create collection summary from unified schema
        collectionSummary = {
          total_pickups: totalPickups,
          total_materials_kg: totalWeight,
          total_value: moneyBalance,
          total_points_earned: pointsBalance
        };
        
        // Assign wallet data
        walletData = walletDataObj;
        
        console.log('WorkingWalletService: Successfully read from unified schema:', {
          moneyBalance,
          totalWeight,
          totalPickups,
          pointsBalance,
          totalPointsEarned,
          tier,
          walletData: walletData,
          pickupsSummary: {
            totalPickups: totalPickups,
            totalWeight: totalWeight,
            totalMoneyValue: moneyBalance,
            completedPickups: completedPickups,
            pendingPickups: pendingPickups
          }
        });
        
      } catch (err) {
        console.log('WorkingWalletService: Unified schema query failed, using fallback:', err);
        
        // Fallback to empty data if unified schema is not available
        walletData = {
          id: user.id,
          user_id: user.id,
          current_points: 0,
          total_points_earned: 0,
          total_points_spent: 0,
          last_updated: new Date().toISOString(),
          tier: 'bronze'
        };
        
        collectionSummary = {
          total_pickups: 0,
          total_materials_kg: 0,
          total_value: 0,
          total_points_earned: 0
        };
      }

      // Use tier from wallet data or calculate from weight
      const finalTier = walletData?.tier || getTierFromWeight(collectionSummary.total_materials_kg);
      
      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: collectionSummary.total_materials_kg * 0.5,
        water_saved_liters: collectionSummary.total_materials_kg * 10,
        landfill_saved_kg: collectionSummary.total_materials_kg * 0.8
      };

      // Calculate next tier requirements based on weight
      const nextTierRequirements = this.calculateNextTierRequirementsByWeight(collectionSummary.total_materials_kg);

      const result: WorkingWalletInfo = {
        wallet: walletData,
        profile: profile,
        collectionSummary: collectionSummary,
        tier: finalTier,
        balance: collectionSummary.total_value,
        points: walletData?.current_points || 0,
        totalWeightKg: collectionSummary.total_materials_kg,
        environmentalImpact: environmentalImpact,
        nextTierRequirements: nextTierRequirements
      };

      console.log('WorkingWalletService: Wallet data retrieved successfully:', {
        balance: result.balance,
        points: result.points,
        tier: result.tier,
        totalWeightKg: result.totalWeightKg,
        totalPickups: result.collectionSummary.total_pickups
      });

      return result;

    } catch (error) {
      console.error('WorkingWalletService: Error fetching wallet data:', error);
      return this.getEmptyWalletInfo();
    }
  }

  private static calculateTier(points: number): string {
    // This method is now deprecated - use getTierFromWeight instead
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  }

  private static calculateNextTierRequirementsByWeight(currentWeightKg: number): {
    nextTier: string | null;
    weightNeeded: number;
    progressPercentage: number;
  } {
    const tiers = [
      { name: 'bronze', minWeight: 0 },
      { name: 'silver', minWeight: 20 },
      { name: 'gold', minWeight: 50 },
      { name: 'platinum', minWeight: 100 }
    ];

    const currentTierIndex = tiers.findIndex(tier => currentWeightKg >= tier.minWeight);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

    if (!nextTier) {
      return {
        nextTier: null,
        weightNeeded: 0,
        progressPercentage: 100
      };
    }

    const weightNeeded = Math.max(0, nextTier.minWeight - currentWeightKg);
    const progressPercentage = Math.min(100, (currentWeightKg / nextTier.minWeight) * 100);

    return {
      nextTier: nextTier.name,
      weightNeeded: weightNeeded,
      progressPercentage: progressPercentage
    };
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
        weightNeeded: 20, // 20kg to reach silver tier
        progressPercentage: 0
      }
    };
  }

  static async refreshWalletData(userId: string): Promise<WorkingWalletInfo> {
    return this.getWalletData(userId);
  }
}
