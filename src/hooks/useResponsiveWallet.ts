import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkingWalletService, WorkingWalletInfo } from '@/lib/workingWalletService';
import { getWalletCache, saveWalletCache, clearWalletCache } from '@/lib/session-utils';

export interface ResponsiveWalletData {
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

export interface UseResponsiveWalletReturn {
  // Data
  balance: number;
  points: number;
  tier: string;
  totalEarnings: number;
  environmentalImpact: ResponsiveWalletData['environmentalImpact'];
  tierBenefits: string[];
  nextTierRequirements: ResponsiveWalletData['nextTierRequirements'];
  totalPickups: number;
  approvedPickups: number;
  pendingPickups: number;
  rejectedPickups: number;
  totalWeightKg: number;
  
  // State
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  refreshWallet: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

export const useResponsiveWallet = (userId?: string): UseResponsiveWalletReturn => {
  const [walletData, setWalletData] = useState<ResponsiveWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Use refs to prevent unnecessary re-renders and race conditions
  const fetchInProgress = useRef(false);
  const lastUserId = useRef<string | undefined>(userId);
  const abortController = useRef<AbortController | null>(null);

  // Cache settings
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for live data
  const FAST_TIMEOUT = 1000; // 1 second for initial paint
  const MAX_RETRIES = 3;

  // Helper function to get tier benefits
  const getTierBenefits = useCallback((tier: string) => {
    const benefits: Record<string, string[]> = {
      bronze: ['Basic rewards', 'Standard support'],
      silver: ['Enhanced rewards', 'Priority support', 'Bonus points'],
      gold: ['Premium rewards', 'VIP support', 'Double points', 'Exclusive offers'],
      platinum: ['Ultimate rewards', '24/7 support', 'Triple points', 'Exclusive access', 'Personal manager']
    };
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  }, []);

  // Optimized fetch function with immediate cache display
  const fetchWalletData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current && !forceRefresh) {
      console.log('Wallet fetch already in progress, skipping...');
      return;
    }

    // Show cached data immediately to prevent limbo loading
    if (!forceRefresh) {
      const cached = getWalletCache(userId);
      if (cached) {
        console.log('Showing cached wallet data immediately');
        setWalletData(cached);
        setLoading(false);
        setIsInitialized(true);
      }
    }

    // Check if we have recent data
    const now = Date.now();
    if (!forceRefresh && walletData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using recent wallet data');
      return;
    }

    // Check if userId changed
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      clearWalletCache();
    }

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    // Cancel previous request if any
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      console.log('Fetching wallet data...');
      
      // Start with a fast timeout to unblock UI
      const fastTimeout = setTimeout(() => {
        if (!walletData) {
          console.log('Fast timeout reached, showing loading state');
          setLoading(false);
        }
      }, FAST_TIMEOUT);

      // Fetch data with retry logic
      let workingData: WorkingWalletInfo | null = null;
      let retryCount = 0;

      while (retryCount < MAX_RETRIES && !workingData) {
        try {
          workingData = await WorkingWalletService.getWalletData(userId);
          break;
        } catch (err) {
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            console.log(`Retry ${retryCount} for wallet data...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            throw err;
          }
        }
      }

      clearTimeout(fastTimeout);

      if (!workingData) {
        throw new Error('Failed to fetch wallet data after retries');
      }

      // Convert to responsive format
      const responsiveData: ResponsiveWalletData = {
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

      setWalletData(responsiveData);
      setLastFetchTime(now);
      setIsInitialized(true);
      
      // Save to cache
      saveWalletCache(userId, responsiveData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      
      // Only set error if we don't have cached data
      if (!walletData) {
        setError(err.message || 'Failed to fetch wallet data');
      }
      
      // Clear cache on persistent errors
      if (err.name !== 'AbortError') {
        clearWalletCache();
      }
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [userId, walletData, lastFetchTime, CACHE_DURATION, getTierBenefits]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('Force refreshing wallet data...');
    setLastFetchTime(0);
    clearWalletCache();
    fetchInProgress.current = false;
    await fetchWalletData(true);
  }, [fetchWalletData]);

  // Regular refresh function
  const refreshWallet = useCallback(async () => {
    if (!userId) return;
    await fetchWalletData(false);
  }, [fetchWalletData, userId]);

  // Initial fetch
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Memoize return values to prevent unnecessary re-renders
  return useMemo(() => ({
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
    isInitialized,
    
    // Actions
    refreshWallet,
    forceRefresh
  }), [
    walletData,
    error,
    loading,
    isInitialized,
    refreshWallet,
    forceRefresh
  ]);
};
