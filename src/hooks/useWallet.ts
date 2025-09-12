import { useState, useEffect, useCallback } from 'react';
import { WorkingWalletService, WorkingWalletInfo } from '@/lib/workingWalletService';
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

    // Clear old cache - we're now using calculated views
    clearWalletCache();
    console.log('Cleared old wallet cache - fetching fresh data from calculated views');

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching fresh wallet data from unified schema...');
      
      // Use the new working wallet service
      const workingData = await WorkingWalletService.getWalletData(userId);
      
      // Convert working data to the expected WalletData format
      const combinedData: WalletData = {
        balance: workingData.balance,
        points: workingData.points,
        tier: workingData.tier,
        totalEarnings: workingData.balance,
        environmentalImpact: workingData.environmentalImpact,
        tierBenefits: getTierBenefits(workingData.tier),
        nextTierRequirements: workingData.nextTierRequirements,
        totalPickups: workingData.collectionSummary.total_pickups,
        approvedPickups: workingData.collectionSummary.total_pickups, // Assuming all are approved
        pendingPickups: 0,
        rejectedPickups: 0,
        totalWeightKg: workingData.totalWeightKg
      };

      setWalletData(combinedData);
      setLastFetchTime(now);
      setIsInitialized(true);
      
      // Save to localStorage cache
      saveWalletCache(userId, combinedData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
      
      // Clear cache on error to prevent showing stale data
      clearWalletCache();
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, walletData, lastFetchTime]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const refreshWallet = useCallback(async () => {
    // Clear all caches and force refresh
    setLastFetchTime(0);
    clearWalletCache();
    
    if (userId) {
      try {
        const workingData = await WorkingWalletService.refreshWalletData(userId);
        
        // Convert working data to the expected WalletData format
        const combinedData: WalletData = {
          balance: workingData.balance,
          points: workingData.points,
          tier: workingData.tier,
          totalEarnings: workingData.balance,
          environmentalImpact: workingData.environmentalImpact,
          tierBenefits: getTierBenefits(workingData.tier),
          nextTierRequirements: workingData.nextTierRequirements,
          totalPickups: workingData.collectionSummary.total_pickups,
          approvedPickups: workingData.collectionSummary.total_pickups,
          pendingPickups: 0,
          rejectedPickups: 0,
          totalWeightKg: workingData.totalWeightKg
        };

        setWalletData(combinedData);
        setLastFetchTime(Date.now());
        setIsInitialized(true);
        
        // Save to localStorage cache
        saveWalletCache(userId, combinedData);
      } catch (err: any) {
        console.error('Error refreshing wallet data:', err);
        setError(err.message || 'Failed to refresh wallet data');
        
        // Clear cache on error to prevent showing stale data
        clearWalletCache();
        setWalletData(null);
      }
    }
  }, [userId]);

  const syncWalletBalances = useCallback(async () => {
    if (!userId) return;
    
    try {
      // This would typically sync with external systems
      console.log('Syncing wallet balances...');
      await refreshWallet();
    } catch (err) {
      console.error('Error syncing wallet:', err);
    }
  }, [userId, refreshWallet]);

  const refreshCustomerPerformance = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('Refreshing customer performance...');
      await refreshWallet();
    } catch (err) {
      console.error('Error refreshing performance:', err);
    }
  }, [userId, refreshWallet]);

  return {
    // Main data - show 0 if no data or if there's an error
    balance: (walletData && !error) ? walletData.balance : 0,
    points: (walletData && !error) ? walletData.points : 0,
    tier: (walletData && !error) ? walletData.tier : 'bronze',
    totalEarnings: (walletData && !error) ? walletData.totalEarnings : 0,
    
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
  if (weightKg >= 500) return 'diamond';
  if (weightKg >= 300) return 'platinum';
  if (weightKg >= 150) return 'gold';
  if (weightKg >= 50) return 'silver';

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

