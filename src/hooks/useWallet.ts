import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
  
  // Use ref to prevent unnecessary re-renders
  const fetchInProgress = useRef(false);
  const lastUserId = useRef<string | undefined>(userId);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
  const FETCH_TIMEOUT_MS = 2000; // soft timeout for initial paint

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;

    // Prevent duplicate requests
    if (fetchInProgress.current) {
      console.log('Wallet fetch already in progress, skipping...');
      return;
    }

    // Show any cached data immediately to avoid blocking UI
    const cached = getWalletCache(userId);
    if (cached && (!walletData || !lastFetchTime)) {
      setWalletData(cached);
      setLoading(false);
    }

    // Check if we have recent in-memory data
    const now = Date.now();
    if (walletData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using in-memory cached wallet data');
      return;
    }

    // Check if userId changed
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      // Clear cache when user changes
      clearWalletCache();
    }

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching fresh wallet data from unified schema...');
      
      // Start fetch and a soft timeout to unblock UI
      const fetchPromise = WorkingWalletService.getWalletData(userId);
      const timeoutId = setTimeout(() => {
        // If still loading after timeout, allow UI to render with cached/defaults
        setLoading(false);
      }, FETCH_TIMEOUT_MS);

      const workingData = await fetchPromise;
      clearTimeout(timeoutId);
      
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
      setLastFetchTime(Date.now());
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
      fetchInProgress.current = false;
    }
  }, [userId]); // Remove walletData and lastFetchTime from dependencies to prevent infinite loops

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const refreshWallet = useCallback(async () => {
    if (!userId) return;
    
    // Clear all caches and force refresh
    setLastFetchTime(0);
    clearWalletCache();
    fetchInProgress.current = false; // Reset fetch flag
    
    try {
      setLoading(true);
      setError(null);
      
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
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Realtime updates: refresh when collections or withdrawals affecting this user change
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet_updates_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections', filter: `customer_id=eq.${userId}` }, () => {
        if (!fetchInProgress.current) {
          refreshWallet();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${userId}` }, () => {
        if (!fetchInProgress.current) {
          refreshWallet();
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [userId, refreshWallet]);

  // Background refresh when app regains focus or becomes visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const maybeRefresh = () => {
      if (document.hidden) return;
      // Throttle using lastFetchTime
      const now = Date.now();
      if (!fetchInProgress.current && now - lastFetchTime > 3000) {
        refreshWallet();
      }
    };
    const onVisibility = () => { if (!document.hidden) maybeRefresh(); };
    window.addEventListener('focus', maybeRefresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', maybeRefresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lastFetchTime, refreshWallet]);

  // Listen for Service Worker messages that hint wallet changed (e.g., after push)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      const type = (event && (event as any).data && (event as any).data.type) || undefined;
      if (type === 'wallet-maybe-updated') {
        if (!fetchInProgress.current) {
          refreshWallet();
        }
      }
    };
    try {
      navigator.serviceWorker.addEventListener('message', handler as any);
    } catch {}
    return () => {
      try { navigator.serviceWorker.removeEventListener('message', handler as any); } catch {}
    };
  }, [refreshWallet]);

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
    
    // Actions
    refreshWallet,
    syncWalletBalances,
    refreshCustomerPerformance
  }), [
    walletData,
    error,
    loading,
    refreshWallet,
    syncWalletBalances,
    refreshCustomerPerformance
  ]);
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

