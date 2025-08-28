import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SimpleWalletService, SimpleWalletData } from '@/lib/simpleWalletService';

export interface WalletData {
  balance: number;
  points: number;
  tier: string;
  totalEarnings: number;
  environmentalImpact: {
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
  };
  tierBenefits: string[];
  nextTierRequirements: {
    nextTier: string | null;
    weightNeeded: number;
    progressPercentage: number;
  };
  totalPickups: number;
  approvedPickups: number;
  pendingPickups: number;
  rejectedPickups: number;
  totalWeightKg: number;
}

export const useWallet = (userId?: string) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch simple wallet data
      const simpleWallet = await SimpleWalletService.getWalletData(userId);
      
      if (!simpleWallet) {
        setError('No wallet data found');
        setLoading(false);
        return;
      }

             // Fetch additional data from other tables with error handling
       let pickups: any[] = [];
       let environmental: any = null;
       
       try {
         const [pickupsResult, environmentalResult] = await Promise.all([
           supabase
             .from('pickups')
             .select('*')
             .eq('user_id', userId),
           supabase
             .from('user_metrics')
             .select('*')
             .eq('user_id', userId)
             .single()
         ]);
         
         pickups = pickupsResult.data || [];
         environmental = environmentalResult.data;
         
         console.log('Successfully fetched pickups and metrics:', {
           pickupsCount: pickups.length,
           hasEnvironmental: !!environmental
         });
       } catch (error) {
         console.warn('Could not fetch pickups/metrics, using fallback data:', error);
         // Use fallback data - this prevents the 403 errors from breaking the wallet display
         pickups = [];
         environmental = null;
       }

             // Calculate environmental impact with fallback to points-based weight
       let totalWeight = pickups.reduce((sum, pickup) => sum + (pickup.weight_kg || 0), 0);
       
       // If no pickup data available, estimate weight from points (assuming 1 point = 0.1 kg)
       if (totalWeight === 0 && simpleWallet.total_points > 0) {
         totalWeight = simpleWallet.total_points * 0.1;
         console.log('Using points-based weight estimation:', {
           points: simpleWallet.total_points,
           estimatedWeight: totalWeight
         });
       }
       
       const co2Saved = environmental?.co2_saved_kg || (totalWeight * 0.5);
       const waterSaved = environmental?.water_saved_liters || (totalWeight * 0.1);
       const landfillSaved = environmental?.landfill_saved_kg || (totalWeight * 0.3);

      // Calculate tier based on actual weight recycled
      const calculatedTier = getTierFromWeight(totalWeight);
      
      // Debug logging for tier calculation
      console.log('Tier Calculation Debug:', {
        totalWeight,
        calculatedTier,
        originalTier: simpleWallet.tier,
        pointsFromWeight: totalWeight, // 1kg = 1 point
        originalPoints: simpleWallet.total_points
      });
      
      // Calculate tier benefits based on calculated tier
      const tierBenefits = getTierBenefits(calculatedTier);
      
      // Calculate next tier requirements based on weight recycled
      const nextTierReqs = getNextTierRequirements(totalWeight);

      const data: WalletData = {
        balance: simpleWallet.balance,
        points: totalWeight, // 1kg = 1 point
        tier: calculatedTier, // Use calculated tier instead of wallet tier
        totalEarnings: simpleWallet.balance,
        environmentalImpact: {
          co2_saved_kg: co2Saved,
          water_saved_liters: waterSaved,
          landfill_saved_kg: landfillSaved
        },
        tierBenefits,
        nextTierRequirements: nextTierReqs,
        totalPickups: pickups.length,
        approvedPickups: pickups.filter(p => p.status === 'approved').length,
        pendingPickups: pickups.filter(p => p.status === 'pending').length,
        rejectedPickups: pickups.filter(p => p.status === 'rejected').length,
        totalWeightKg: totalWeight
      };

      setWalletData(data);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const refreshWallet = useCallback(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const syncWalletBalances = useCallback(async () => {
    if (!userId) return;
    
    try {
      // This would typically sync with external systems
      console.log('Syncing wallet balances...');
      await fetchWalletData();
    } catch (err) {
      console.error('Error syncing wallet:', err);
    }
  }, [userId, fetchWalletData]);

  const refreshCustomerPerformance = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('Refreshing customer performance...');
      await fetchWalletData();
    } catch (err) {
      console.error('Error refreshing performance:', err);
    }
  }, [userId, fetchWalletData]);

  return {
    // Main data
    balance: walletData?.balance || 0,
    points: walletData?.points || 0,
    tier: walletData?.tier || 'bronze',
    totalEarnings: walletData?.totalEarnings || 0,
    
    // Environmental impact
    environmentalImpact: walletData?.environmentalImpact || {
      co2_saved_kg: 0,
      water_saved_liters: 0,
      landfill_saved_kg: 0
    },
    
    // Tier information
    tierBenefits: walletData?.tierBenefits || [],
    nextTierRequirements: walletData?.nextTierRequirements || {
      nextTier: null,
      weightNeeded: 0,
      progressPercentage: 0
    },
    
    // Pickup statistics
    totalPickups: walletData?.totalPickups || 0,
    approvedPickups: walletData?.approvedPickups || 0,
    pendingPickups: walletData?.pendingPickups || 0,
    rejectedPickups: walletData?.rejectedPickups || 0,
    totalWeightKg: walletData?.totalWeightKg || 0,
    
    // State
    loading,
    error,
    
    // Actions
    refreshWallet,
    syncWalletBalances,
    refreshCustomerPerformance
  };
};

// Helper functions
function getTierFromWeight(weightKg: number): string {
  console.log('getTierFromWeight called with:', weightKg);
  
  if (weightKg >= 100) return 'platinum';
  if (weightKg >= 50) return 'gold';
  if (weightKg >= 20) return 'silver';
  
  // Ensure 0 kg returns 'bronze'
  const tier = 'bronze';
  console.log('Tier calculated:', tier, 'for weight:', weightKg);
  return tier;
}

function getTierBenefits(tier: string): string[] {
  switch (tier) {
    case 'platinum':
      return [
        'Priority pickup scheduling',
        'Exclusive rewards',
        'VIP customer support',
        'Special event invitations'
      ];
    case 'gold':
      return [
        'Faster pickup scheduling',
        'Enhanced rewards',
        'Priority customer support'
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

function getNextTierRequirements(currentWeightKg: number) {
  if (currentWeightKg >= 100) {
    return { nextTier: null, weightNeeded: 0, progressPercentage: 100 };
  }
  
  if (currentWeightKg >= 50) {
    const weightNeeded = 100 - currentWeightKg;
    const progressPercentage = (currentWeightKg / 100) * 100;
    return { nextTier: 'platinum', weightNeeded, progressPercentage };
  }
  
  if (currentWeightKg >= 20) {
    const weightNeeded = 50 - currentWeightKg;
    const progressPercentage = (currentWeightKg / 50) * 100;
    return { nextTier: 'gold', weightNeeded, progressPercentage };
  }
  
  const weightNeeded = 20 - currentWeightKg;
  const progressPercentage = (currentWeightKg / 20) * 100;
  return { nextTier: 'silver', weightNeeded, progressPercentage };
}
