"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkingWalletService } from '@/lib/workingWalletService';
import { saveWalletCache, getWalletCache, clearWalletCache } from '@/lib/session-utils';

interface OptimizedWalletData {
  balance: number;
  points: number;
  tier: string;
  totalEarnings: number;
  environmentalImpact: {
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
  };
  tierBenefits: any;
  nextTierRequirements: {
    nextTier: string;
    weightNeeded: number;
    progressPercentage: number;
  };
  totalPickups: number;
  approvedPickups: number;
  pendingPickups: number;
  rejectedPickups: number;
  totalWeightKg: number;
}

interface UseOptimizedWalletReturn {
  walletData: OptimizedWalletData | null;
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  lastFetchTime: number;
  isStale: boolean;
}

// Cache duration: 2 minutes for live data
const CACHE_DURATION = 2 * 60 * 1000;

export const useOptimizedWallet = (userId?: string): UseOptimizedWalletReturn => {
  const [walletData, setWalletData] = useState<OptimizedWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Check if data is stale
  const isStale = useMemo(() => {
    return Date.now() - lastFetchTime > CACHE_DURATION;
  }, [lastFetchTime]);

  // Memoized tier benefits calculation
  const getTierBenefits = useCallback((tier: string) => {
    const benefits = {
      bronze: { discount: 0, priority: 'Standard', color: '#CD7F32' },
      silver: { discount: 5, priority: 'High', color: '#C0C0C0' },
      gold: { discount: 10, priority: 'Premium', color: '#FFD700' },
      platinum: { discount: 15, priority: 'VIP', color: '#E5E4E2' }
    };
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  }, []);

  // Optimized fetch function with caching
  const fetchWalletData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cachedData = getWalletCache(userId);
      if (cachedData) {
        console.log('Using cached wallet data');
        setWalletData(cachedData);
        setLastFetchTime(Date.now());
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching fresh wallet data...');
      const workingData = await WorkingWalletService.refreshWalletData(userId);
      
      // Convert to optimized format
      const optimizedData: OptimizedWalletData = {
        balance: workingData.balance,
        points: workingData.points,
        tier: workingData.tier,
        totalEarnings: workingData.balance,
        environmentalImpact: workingData.environmentalImpact,
        tierBenefits: getTierBenefits(workingData.tier),
        nextTierRequirements: {
          nextTier: workingData.nextTierRequirements?.nextTier || '',
          weightNeeded: workingData.nextTierRequirements?.weightNeeded || 0,
          progressPercentage: workingData.nextTierRequirements?.progressPercentage || 0,
        },
        totalPickups: workingData.collectionSummary.total_pickups,
        approvedPickups: workingData.collectionSummary.total_pickups,
        pendingPickups: 0,
        rejectedPickups: 0,
        totalWeightKg: workingData.totalWeightKg
      };

      setWalletData(optimizedData);
      setLastFetchTime(Date.now());
      
      // Save to cache
      saveWalletCache(userId, optimizedData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
      
      // Try to use cached data as fallback
      const cachedData = getWalletCache(userId);
      if (cachedData) {
        console.log('Using cached data as fallback');
        setWalletData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, getTierBenefits]);

  // Refresh function
  const refreshWallet = useCallback(async () => {
    await fetchWalletData(true);
  }, [fetchWalletData]);

  // Initial load
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Auto-refresh when data becomes stale
  useEffect(() => {
    if (!isStale || !userId) return;

    const timer = setTimeout(() => {
      fetchWalletData(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isStale, userId, fetchWalletData]);

  return {
    walletData,
    loading,
    error,
    refreshWallet,
    lastFetchTime,
    isStale
  };
};
