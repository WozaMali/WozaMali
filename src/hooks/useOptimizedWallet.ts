import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WorkingWalletService, WorkingWalletInfo } from '@/lib/workingWalletService';
import { getWalletCache, saveWalletCache, clearWalletCache } from '@/lib/session-utils';
import { realtimeDataService } from '@/lib/realtimeDataService';

export interface OptimizedWalletData {
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

export const useOptimizedWallet = (userId?: string) => {
  const [walletData, setWalletData] = useState<OptimizedWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchInProgress = useRef(false);
  const lastUserId = useRef<string | undefined>(userId);
  const subscriptionIds = useRef<string[]>([]);
  const renderCount = useRef(0);

  const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache
  const FETCH_TIMEOUT_MS = 1000; // Faster timeout

  // Convert WorkingWalletInfo to OptimizedWalletData
  const convertToOptimizedData = useCallback((workingData: WorkingWalletInfo): OptimizedWalletData => {
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

    renderCount.current += 1;
    
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
      console.log('🔄 Fetching optimized wallet data...');
      
      const fetchPromise = WorkingWalletService.getWalletData(userId);
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, FETCH_TIMEOUT_MS);

      const workingData = await fetchPromise;
      clearTimeout(timeoutId);
      
      const optimizedData = convertToOptimizedData(workingData);
      setWalletData(optimizedData);
      setLastFetchTime(now);
      
      // Save to cache
      saveWalletCache(userId, optimizedData);
      
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
      clearWalletCache();
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [userId, convertToOptimizedData, walletData, lastFetchTime]);

  // Set up real-time subscriptions with debouncing
  useEffect(() => {
    if (!userId) return;

    console.log('🔗 Setting up optimized real-time wallet subscriptions...');

    const subscriptionIds = realtimeDataService.subscribeToAllUpdates(userId, {
      onWalletUpdate: (data) => {
        console.log('📡 Real-time wallet update received');
        const optimizedData = convertToOptimizedData(data);
        setWalletData(optimizedData);
        setLastFetchTime(Date.now());
        saveWalletCache(userId, optimizedData);
        setIsRealtimeConnected(true);
      },
      onCollectionUpdate: () => {
        console.log('📦 Collection update, refreshing wallet...');
        // Debounce collection updates
        setTimeout(() => {
          fetchWalletData(true);
        }, 500);
      }
    });

    // Store subscription IDs for cleanup
    subscriptionIds.current = subscriptionIds;

    return () => {
      console.log('🧹 Cleaning up optimized real-time subscriptions...');
      realtimeDataService.unsubscribeUser(userId);
    };
  }, [userId, convertToOptimizedData, fetchWalletData]);

  // Initial data fetch with delay to prevent blocking
  useEffect(() => {
    const timer = setTimeout(() => {
    fetchWalletData();
    }, 100); // Small delay to prevent blocking initial render

    return () => clearTimeout(timer);
  }, [fetchWalletData]);

  // Handle app visibility changes with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let visibilityTimer: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(() => {
          console.log('👁️ App became visible, refreshing data...');
          fetchWalletData(true);
        }, 1000); // Debounce visibility changes
      }
    };

    const handleFocus = () => {
      if (userId) {
        clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(() => {
          console.log('🎯 App focused, refreshing data...');
      fetchWalletData(true);
    }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(visibilityTimer);
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

  // Memoized return values with performance optimization
  return useMemo(() => {
    // Performance logging
    if (process.env.NODE_ENV === 'development' && renderCount.current > 0) {
      console.log(`📊 OptimizedWallet render #${renderCount.current}`);
    }

  return {
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
    };
  }, [
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