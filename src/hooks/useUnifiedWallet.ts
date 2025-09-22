// Unified Wallet Hook for Main App
// Provides real-time wallet data and balance updates using the unified schema

import { useState, useEffect, useCallback } from 'react';
import { UnifiedWalletService, UnifiedWalletData, WalletUpdateRequest, CollectionSummary } from '../lib/unifiedWalletService';

export interface UseUnifiedWalletReturn {
  // Main data
  walletData: UnifiedWalletData | null;
  collectionSummary: CollectionSummary | null;
  
  // State
  loading: boolean;
  error: string | null;
  lastFetchTime: number;
  
  // Actions
  refreshWallet: () => Promise<void>;
  updateBalance: (request: Omit<WalletUpdateRequest, 'user_id'>) => Promise<boolean>;
  processCollection: (collectionId: string) => Promise<boolean>;
  
  // Computed values
  tierBenefits: string[];
  nextTierRequirements: {
    nextTier: string | null;
    pointsNeeded: number;
    progressPercentage: number;
  };
}

export const useUnifiedWallet = (userId?: string): UseUnifiedWalletReturn => {
  const [walletData, setWalletData] = useState<UnifiedWalletData | null>(null);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Cache duration: 2 minutes for live data
  const CACHE_DURATION = 2 * 60 * 1000;

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;

    // Check if we have recent data in cache
    const now = Date.now();
    if (walletData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached wallet data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching live wallet data from unified schema...');
      
      // Fetch wallet data and collection summary in parallel
      const [wallet, summary] = await Promise.all([
        UnifiedWalletService.getWalletData(userId),
        UnifiedWalletService.getCollectionSummary(userId)
      ]);

      if (wallet) {
        setWalletData(wallet);
        setLastFetchTime(now);
        console.log('Live wallet data updated:', wallet);
      } else {
        setError('Failed to fetch wallet data');
      }

      if (summary) {
        setCollectionSummary(summary);
        console.log('Collection summary updated:', summary);
      }

    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, [userId, walletData, lastFetchTime, CACHE_DURATION]);

  const refreshWallet = useCallback(async () => {
    console.log('Force refreshing wallet data...');
    setLastFetchTime(0); // Clear cache
    await fetchWalletData();
  }, [fetchWalletData]);

  const updateBalance = useCallback(async (request: Omit<WalletUpdateRequest, 'user_id'>): Promise<boolean> => {
    if (!userId) {
      console.error('No user ID provided for balance update');
      return false;
    }

    try {
      console.log('Updating wallet balance:', request);
      
      const success = await UnifiedWalletService.updateWalletBalance({
        ...request,
        user_id: userId
      });

      if (success) {
        // Refresh wallet data after successful update
        await refreshWallet();
        console.log('Wallet balance updated successfully');
      } else {
        console.error('Failed to update wallet balance');
      }

      return success;
    } catch (err: any) {
      console.error('Error updating wallet balance:', err);
      setError(err.message || 'Failed to update wallet balance');
      return false;
    }
  }, [userId, refreshWallet]);

  const processCollection = useCallback(async (collectionId: string): Promise<boolean> => {
    try {
      console.log('Processing collection payment:', collectionId);
      
      const success = await UnifiedWalletService.processCollectionPayment(collectionId);

      if (success) {
        // Refresh wallet data after successful collection processing
        await refreshWallet();
        console.log('Collection payment processed successfully');
      } else {
        console.error('Failed to process collection payment');
      }

      return success;
    } catch (err: any) {
      console.error('Error processing collection payment:', err);
      setError(err.message || 'Failed to process collection payment');
      return false;
    }
  }, [refreshWallet]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time wallet subscriptions...');

    // Subscribe to wallet updates
    const walletSubscription = UnifiedWalletService.subscribeToWalletUpdates(
      userId,
      (payload) => {
        console.log('Real-time wallet update received:', payload);
        // Refresh data when wallet changes
        fetchWalletData();
      }
    );

    // Subscribe to collection updates
    const collectionSubscription = UnifiedWalletService.subscribeToCollectionUpdates(
      userId,
      (payload) => {
        console.log('Real-time collection update received:', payload);
        // Refresh data when collections change
        fetchWalletData();
      }
    );

    return () => {
      console.log('Cleaning up wallet subscriptions...');
      walletSubscription.unsubscribe();
      collectionSubscription.unsubscribe();
    };
  }, [userId, fetchWalletData]);

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Computed values
  const tierBenefits = walletData ? UnifiedWalletService.getTierBenefits(walletData.tier) : [];
  const nextTierRequirements = walletData ? UnifiedWalletService.getNextTierRequirementsByWeight(walletData.total_weight_kg) : {
    nextTier: null,
    pointsNeeded: 0,
    progressPercentage: 0
  };

  return {
    // Main data
    walletData,
    collectionSummary,
    
    // State
    loading,
    error,
    lastFetchTime,
    
    // Actions
    refreshWallet,
    updateBalance,
    processCollection,
    
    // Computed values
    tierBenefits,
    nextTierRequirements
  };
};

// Helper hook for wallet transactions
export const useWalletTransactions = (userId?: string, limit: number = 50) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await UnifiedWalletService.getWalletTransactions(userId, limit);
      setTransactions(data);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions
  };
};

// Helper hook for points history
export const usePointsHistory = (userId?: string, limit: number = 50) => {
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPointsHistory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await UnifiedWalletService.getPointsHistory(userId, limit);
      setPointsHistory(data);
    } catch (err: any) {
      console.error('Error fetching points history:', err);
      setError(err.message || 'Failed to fetch points history');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchPointsHistory();
  }, [fetchPointsHistory]);

  return {
    pointsHistory,
    loading,
    error,
    refresh: fetchPointsHistory
  };
};


