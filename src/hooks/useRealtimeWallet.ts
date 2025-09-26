import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WorkingWalletService, WorkingWalletInfo } from '@/lib/workingWalletService';
import { getWalletCache, saveWalletCache, clearWalletCache } from '@/lib/session-utils';
import { realtimeDataService } from '@/lib/realtimeDataService';

export interface RealtimeWalletData {
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
  lastUpdated: number;
  isRealtimeConnected: boolean;
}

export const useRealtimeWallet = (userId?: string) => {
  const [walletData, setWalletData] = useState<RealtimeWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const fetchInProgress = useRef(false);
  const lastUserId = useRef<string | undefined>(userId);
  const subscriptionIds = useRef<string[]>([]);

  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
  const FETCH_TIMEOUT_MS = 1500; // Faster timeout

  // Convert WorkingWalletInfo to RealtimeWalletData
  const convertToRealtimeData = useCallback((workingData: WorkingWalletInfo): RealtimeWalletData => {
    return {
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
      totalWeightKg: workingData.totalWeightKg,
      lastUpdated: Date.now(),
      isRealtimeConnected: true
    };
  }, []);

  const fetchWalletData = useCallback(async (forceRefresh = false) => {
    if (!userId || fetchInProgress.current) return;

    // Show cached data immediately for better UX
    const cached = getWalletCache(userId);
    if (cached && !forceRefresh && (!walletData || !lastFetchTime)) {
      setWalletData({ ...cached, isRealtimeConnected: false });
      setLoading(false);
    }

    // Check cache validity
    const now = Date.now();
    if (!forceRefresh && walletData && (now - lastFetchTime) < CACHE_DURATION) {
      return;
    }

    // Clear cache if user changed
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      clearWalletCache();
    }

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching real-time wallet data...');
      
      const fetchPromise = WorkingWalletService.getWalletData(userId);
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, FETCH_TIMEOUT_MS);

      const workingData = await fetchPromise;
      clearTimeout(timeoutId);
      
      const realtimeData = convertToRealtimeData(workingData);
      setWalletData(realtimeData);
      setLastFetchTime(now);
      
      // Save to cache
      saveWalletCache(userId, realtimeData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
      clearWalletCache();
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [userId, convertToRealtimeData, walletData, lastFetchTime]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    console.log('🔗 Setting up real-time wallet subscriptions...');

    const subscriptionIds = realtimeDataService.subscribeToAllUpdates(userId, {
      onWalletUpdate: (data) => {
        console.log('📡 Real-time wallet update received');
        const realtimeData = convertToRealtimeData(data);
        setWalletData(realtimeData);
        setLastFetchTime(Date.now());
        saveWalletCache(userId, realtimeData);
        setIsRealtimeConnected(true);
      },
      onCollectionUpdate: () => {
        console.log('📦 Collection update, refreshing wallet...');
        fetchWalletData(true);
      }
    });

    // Store subscription IDs for cleanup
    subscriptionIds.current = subscriptionIds;

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      realtimeDataService.unsubscribeUser(userId);
    };
  }, [userId, convertToRealtimeData, fetchWalletData]);

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Handle app visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('👁️ App became visible, refreshing data...');
        fetchWalletData(true);
      }
    };

    const handleFocus = () => {
      if (userId) {
        console.log('🎯 App focused, refreshing data...');
        fetchWalletData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, fetchWalletData]);

  // Handle network status changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Network online, reconnecting real-time...');
      setIsRealtimeConnected(true);
      if (userId) {
        fetchWalletData(true);
      }
    };

    const handleOffline = () => {
      console.log('📴 Network offline');
      setIsRealtimeConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, fetchWalletData]);

  const refreshWallet = useCallback(async () => {
    if (!userId) return;
    console.log('🔄 Manual wallet refresh requested');
    await fetchWalletData(true);
  }, [userId, fetchWalletData]);

  const forceRefresh = useCallback(async () => {
    if (!userId) return;
    console.log('⚡ Force refresh requested');
    clearWalletCache();
    setLastFetchTime(0);
    await fetchWalletData(true);
  }, [userId, fetchWalletData]);

  // Memoized return values
  return useMemo(() => ({
    // Data
    balance: walletData?.balance ?? 0,
    points: walletData?.points ?? 0,
    tier: walletData?.tier ?? 'bronze',
    totalEarnings: walletData?.totalEarnings ?? 0,
    environmentalImpact: walletData?.environmentalImpact ?? {
      co2_saved_kg: 0,
      water_saved_liters: 0,
      landfill_saved_kg: 0
    },
    tierBenefits: walletData?.tierBenefits ?? [],
    nextTierRequirements: walletData?.nextTierRequirements ?? {
      nextTier: null,
      weightNeeded: 0,
      progressPercentage: 0
    },
    totalPickups: walletData?.totalPickups ?? 0,
    approvedPickups: walletData?.approvedPickups ?? 0,
    pendingPickups: walletData?.pendingPickups ?? 0,
    rejectedPickups: walletData?.rejectedPickups ?? 0,
    totalWeightKg: walletData?.totalWeightKg ?? 0,
    
    // State
    loading,
    error,
    isRealtimeConnected: isRealtimeConnected || walletData?.isRealtimeConnected || false,
    lastUpdated: walletData?.lastUpdated,
    
    // Actions
    refreshWallet,
    forceRefresh,
    
    // Connection status
    connectionStatus: realtimeDataService.getConnectionStatus()
  }), [
    walletData,
    loading,
    error,
    isRealtimeConnected,
    refreshWallet,
    forceRefresh
  ]);
};

// Helper functions
function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ['Basic rewards', 'Standard support'],
    silver: ['Enhanced rewards', 'Priority support', 'Bonus points'],
    gold: ['Premium rewards', 'VIP support', 'Double points', 'Exclusive offers'],
    platinum: ['Ultimate rewards', '24/7 support', 'Triple points', 'Exclusive access', 'Personal manager'],
    diamond: ['Ultimate rewards', '24/7 support', 'Triple points', 'Exclusive access', 'Personal manager', 'Diamond status']
  };
  return benefits[tier] || benefits.bronze;
}
