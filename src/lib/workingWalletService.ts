import { supabase } from './supabase';

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

      // Calculate wallet data from pickups tables (same as Office App)
      let walletData: WorkingWalletData | null = null;
      let collectionSummary: CollectionSummary;
      
      try {
        console.log('WorkingWalletService: Calculating wallet from pickups data...');
        
        // Read calculated wallet balance from Admin/Office App view (no calculations)
        const { data: walletTableData, error: walletError } = await supabase
          .from('main_app_user_wallet')
          .select('current_balance, total_earned, total_points, current_tier')
          .eq('user_id', userId)
          .single();
          
        console.log('WorkingWalletService: Wallet data from Admin/Office App view:', {
          walletTableData,
          walletError,
          hasWalletData: !!walletTableData,
          walletBalance: walletTableData?.current_balance,
          walletTier: walletTableData?.current_tier,
          errorMessage: walletError?.message
        });
        
        // Read calculated collection data from Admin/Office App view (no calculations)
        const { data: collectionsSummary, error: collectionsError } = await supabase
          .from('user_collections_summary')
          .select('total_collections, total_weight, approved_collections, pending_collections, total_money_value, primary_material_type, average_rate_per_kg')
          .eq('user_id', userId)
          .single();
          
        console.log('WorkingWalletService: Collections summary from Admin/Office App view:', {
          collectionsSummary,
          collectionsError,
          hasCollections: !!collectionsSummary,
          totalCollections: collectionsSummary?.total_collections || 0,
          totalWeight: collectionsSummary?.total_weight || 0,
          totalMoneyValue: collectionsSummary?.total_money_value || 0,
          primaryMaterialType: collectionsSummary?.primary_material_type || 'Unknown',
          averageRatePerKg: collectionsSummary?.average_rate_per_kg || 0,
          approvedCollections: collectionsSummary?.approved_collections || 0,
          pendingCollections: collectionsSummary?.pending_collections || 0,
          errorMessage: collectionsError?.message
        });
        
        // Read calculated values from Admin/Office App views (no calculations)
        const moneyBalance = walletTableData?.current_balance || collectionsSummary?.total_money_value || 0;
        const totalWeight = collectionsSummary?.total_weight || 0;
        const totalPickups = collectionsSummary?.total_collections || 0;
        
        // Points = Total Weight (as per user requirement)
        const pointsBalance = totalWeight;
        
        // Create wallet data from Office App structure
        const walletDataObj = {
          id: user.id,
          user_id: userId,
          current_points: pointsBalance, // Points = Total Weight
          total_points_earned: pointsBalance, // Same as current points
          total_points_spent: 0, // No points spent
          last_updated: new Date().toISOString(),
          tier: walletTableData?.current_tier || 'bronze'
        };
        
        // Create collection summary from actual data
        collectionSummary = {
          total_pickups: totalPickups,
          total_materials_kg: totalWeight,
          total_value: moneyBalance,
          total_points_earned: pointsBalance // Points = Total Weight
        };
        
        // Assign wallet data
        walletData = walletDataObj;
        
        console.log('WorkingWalletService: Read calculated data from Admin/Office App views:', {
          moneyBalance,
          totalWeight,
          totalPickups,
          pointsBalance,
          tier: walletTableData?.current_tier,
          walletData: walletData,
          collectionsSummary: {
            totalCollections: collectionsSummary?.total_collections,
            totalWeight: collectionsSummary?.total_weight,
            totalMoneyValue: collectionsSummary?.total_money_value,
            primaryMaterialType: collectionsSummary?.primary_material_type,
            averageRatePerKg: collectionsSummary?.average_rate_per_kg,
            approvedCollections: collectionsSummary?.approved_collections,
            pendingCollections: collectionsSummary?.pending_collections
          },
          DEBUGGING: {
            walletTableDataExists: !!walletTableData,
            collectionsSummaryExists: !!collectionsSummary,
            moneyBalanceSource: walletTableData?.current_balance,
            totalWeightSource: collectionsSummary?.total_weight
          }
        });
      } catch (err) {
        console.log('WorkingWalletService: Wallet query failed, using fallback:', err);
        walletData = {
          id: user.id,
          user_id: user.id,
          current_points: 0,
          total_points_earned: 0,
          total_points_spent: 0,
          last_updated: new Date().toISOString()
        };
        
        collectionSummary = {
          total_pickups: 0,
          total_materials_kg: 0,
          total_value: 0,
          total_points_earned: 0
        };
      }

      // Use tier from wallets table (Office App structure)
      const tier = walletData?.tier || 'bronze';
      
      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: collectionSummary.total_materials_kg * 0.5,
        water_saved_liters: collectionSummary.total_materials_kg * 10,
        landfill_saved_kg: collectionSummary.total_materials_kg * 0.8
      };

      // Calculate next tier requirements
      const nextTierRequirements = this.calculateNextTierRequirements(walletData.current_points);

      const result: WorkingWalletInfo = {
        wallet: walletData,
        profile: profile,
        collectionSummary: collectionSummary,
        tier: tier,
        balance: collectionSummary.total_value, // Use money balance from wallets table
        points: walletData.current_points, // Use points from user_wallets table
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
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  }

  private static calculateNextTierRequirements(currentPoints: number): {
    nextTier: string | null;
    weightNeeded: number;
    progressPercentage: number;
  } {
    const tiers = [
      { name: 'bronze', minPoints: 0 },
      { name: 'silver', minPoints: 100 },
      { name: 'gold', minPoints: 500 },
      { name: 'platinum', minPoints: 1000 }
    ];

    const currentTierIndex = tiers.findIndex(tier => currentPoints >= tier.minPoints);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

    if (!nextTier) {
      return {
        nextTier: null,
        weightNeeded: 0,
        progressPercentage: 100
      };
    }

    const pointsNeeded = nextTier.minPoints - currentPoints;
    const weightNeeded = Math.max(0, pointsNeeded); // Assuming 1 point per kg
    const progressPercentage = Math.min(100, (currentPoints / nextTier.minPoints) * 100);

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
        weightNeeded: 100,
        progressPercentage: 0
      }
    };
  }

  static async refreshWalletData(userId: string): Promise<WorkingWalletInfo> {
    return this.getWalletData(userId);
  }
}
