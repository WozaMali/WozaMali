import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getWalletCache, saveWalletCache, clearWalletCache } from '@/lib/session-utils';

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
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;

    // Check if we have recent data in cache
    const now = Date.now();
    if (walletData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached wallet data');
      return;
    }

    // Check localStorage cache first
    const cachedData = getWalletCache(userId);
    if (cachedData) {
      console.log('Using localStorage cached wallet data');
      setWalletData(cachedData);
      setLastFetchTime(now);
      setIsInitialized(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching fresh wallet data...');
      
      // Fetch wallet data - try enhanced_wallets first, then fallback to wallets
      let wallet = null;
      let walletError = null;
      
      try {
        // Try enhanced_wallets first
        const { data: enhancedWallet, error: enhancedError } = await supabase
          .from('enhanced_wallets')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (enhancedWallet) {
          wallet = enhancedWallet;
          console.log('Found wallet in enhanced_wallets table');
        } else if (enhancedError && enhancedError.code === 'PGRST116') {
          // Table doesn't exist or no data, try wallets table
          console.log('enhanced_wallets table empty, trying wallets table');
          const { data: regularWallet, error: regularError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (regularWallet) {
            wallet = regularWallet;
            console.log('Found wallet in wallets table');
          } else if (regularError && regularError.code === 'PGRST116') {
            console.log('No wallet found in either table');
          } else if (regularError) {
            walletError = regularError;
          }
        } else if (enhancedError) {
          walletError = enhancedError;
        }
      } catch (error) {
        console.warn('Error fetching wallet data:', error);
        // Try wallets table as fallback
        try {
          const { data: fallbackWallet, error: fallbackError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (fallbackWallet) {
            wallet = fallbackWallet;
            console.log('Found wallet in wallets table (fallback)');
          } else if (fallbackError) {
            walletError = fallbackError;
          }
        } catch (fallbackError) {
          console.warn('Fallback wallet fetch also failed:', fallbackError);
        }
      }

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      // Fetch user metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (metricsError && metricsError.code !== 'PGRST116') {
        console.warn('Could not fetch pickups/metrics, using fallback data:', metricsError);
      }

      // Fetch recent pickups for tier calculation
      const { data: pickups, error: pickupsError } = await supabase
        .from('pickups')
        .select('total_kg, status')
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (pickupsError) {
        console.warn('Could not fetch pickups for tier calculation:', pickupsError);
      }

      // Calculate total weight from approved pickups
      const totalWeightKg = pickups?.reduce((sum, pickup) => sum + (pickup.total_kg || 0), 0) || 0;
      
      // Calculate tier based on weight
      const calculatedTier = getTierFromWeight(totalWeightKg);
      
      // Get tier benefits
      const tierBenefits = getTierBenefits(calculatedTier);
      
      // Calculate next tier requirements
      const nextTierRequirements = getNextTierRequirements(totalWeightKg);

      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: totalWeightKg * 0.5, // Rough estimate: 0.5kg CO2 saved per kg recycled
        water_saved_liters: totalWeightKg * 10, // Rough estimate: 10L water saved per kg recycled
        landfill_saved_kg: totalWeightKg * 0.8 // Rough estimate: 0.8kg landfill waste saved per kg recycled
      };

      // Calculate points: 1kg recycled = 1 point
      const calculatedPoints = totalWeightKg;
      
      // Use wallet balance from database, or calculate from points if not available
      const walletBalance = wallet?.balance || (calculatedPoints * 0.10); // 10 cents per point

      const combinedData: WalletData = {
        balance: walletBalance,
        points: calculatedPoints, // Points = weight recycled (1kg = 1 point)
        tier: calculatedTier,
        totalEarnings: wallet?.total_earnings || walletBalance,
        environmentalImpact,
        tierBenefits,
        nextTierRequirements,
        totalPickups: metrics?.total_pickups || 0,
        approvedPickups: metrics?.approved_pickups || 0,
        pendingPickups: metrics?.pending_pickups || 0,
        rejectedPickups: metrics?.rejected_pickups || 0,
        totalWeightKg
      };

      setWalletData(combinedData);
      setLastFetchTime(now);
      setIsInitialized(true);
      
      // Save to localStorage cache
      saveWalletCache(userId, combinedData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, [userId, walletData, lastFetchTime]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const refreshWallet = useCallback(() => {
    // Clear all caches and force refresh
    setLastFetchTime(0);
    clearWalletCache();
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
