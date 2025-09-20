"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Recycle, Leaf, TrendingUp, ArrowUpRight, ArrowDownRight, Gift, Heart, Star, Calendar, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Logo from "./Logo";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { supabase } from "@/lib/supabase";
import { AddressService } from "@/lib/addressService";
import { WorkingWalletService } from "@/lib/workingWalletService";
import VirtualizedTransactionList from "./VirtualizedTransactionList";

const Dashboard = memo(() => {
  const navigate = useRouter();
  const { logMetrics } = usePerformanceMonitor('Dashboard');
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  const { user } = authContext;
  
  // Use the enhanced wallet hook to get comprehensive data
  const { 
    balance: walletBalance, 
    points: totalPoints,
    tier: userTier,
    totalEarnings,
    loading: walletLoading,
    error: walletError,
    refreshWallet,
    // Enhanced properties
    environmentalImpact,
    nextTierRequirements,
    totalWeightKg
  } = useWallet(user?.id);

  // Memoize safe values to prevent unnecessary re-renders
  const safeWalletBalance = useMemo(() => walletBalance || 0, [walletBalance]);
  const safeTotalPoints = useMemo(() => totalPoints || 0, [totalPoints]);
  const safeUserTier = useMemo(() => userTier || 'bronze', [userTier]);
  const safeTotalWeightKg = useMemo(() => totalWeightKg || 0, [totalWeightKg]);
  const safeEnvironmentalImpact = useMemo(() => environmentalImpact || {
    co2_saved_kg: 0,
    water_saved_liters: 0,
    landfill_saved_kg: 0
  }, [environmentalImpact]);
  const safeNextTierRequirements = useMemo(() => nextTierRequirements || {
    nextTier: 'silver',
    weightNeeded: 20,
    progressPercentage: 0
  }, [nextTierRequirements]);

  // Consolidated state for better performance
  const [dashboardData, setDashboardData] = useState({
    allTransactions: [] as any[],
    recentLoading: false, // Start with false to prevent initial loading state
    recentError: null as string | null,
    computedBalance: null as number | null,
    nonPetBalance: null as number | null,
    userAddress: null as any,
    addressLoading: false // Start with false to prevent initial loading state
  });

  // Track if initial load is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  
  // Track app visibility state to handle lock/unlock scenarios
  const [isAppVisible, setIsAppVisible] = useState(true);
  
  // Simple loading state that doesn't depend on complex logic
  const [simpleLoading, setSimpleLoading] = useState(true);

  // Memoize expensive calculations to prevent re-computation on every render
  const totalKgRecycled = useMemo(() => safeTotalWeightKg || safeTotalPoints, [safeTotalWeightKg, safeTotalPoints]);
  const co2Saved = useMemo(() => safeEnvironmentalImpact?.co2_saved_kg || (totalKgRecycled * 0.5), [safeEnvironmentalImpact?.co2_saved_kg, totalKgRecycled]);

  // Prefer non-PET unified total; fallback to walletBalance
  const displayBalance = useMemo(() => 
    (typeof dashboardData.nonPetBalance === 'number') ? dashboardData.nonPetBalance : safeWalletBalance,
    [dashboardData.nonPetBalance, safeWalletBalance]
  );

  // Optimized address loading function
  const loadUserAddress = useCallback(async (userId: string) => {
    try {
      // 1) Try unified users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, full_name, phone, role_id, status,
          street_addr, township_id, subdivision, city, postal_code
        `)
        .eq('id', userId)
        .maybeSingle();

      if (!userError && userData) {
        return userData;
      }

      // 2) Try user_addresses table
      const { data: defaultAddr, error: addrErr } = await supabase
        .from('user_addresses')
        .select('address_line1, address_line2, city, province, postal_code')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();

      if (!addrErr && defaultAddr) {
        return {
          address_line1: defaultAddr.address_line1,
          address_line2: defaultAddr.address_line2,
          city: defaultAddr.city,
          postal_code: defaultAddr.postal_code,
          province: defaultAddr.province
        };
      }

      // 3) Try RPC helper
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_default_address', {
          target_user_uuid: userId,
          address_type_filter: null
        });
        
        if (!rpcError && rpcData?.found && rpcData.address) {
          const a = rpcData.address;
          return {
            address_line1: a.address_line1,
            address_line2: a.address_line2,
            city: a.city,
            postal_code: a.postal_code,
            province: a.province
          };
        }
      } catch (_) {
        // RPC not available, continue to fallback
      }

      // 4) Fallback to auth metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          street_addr: user.user_metadata?.street_address || null,
          subdivision: user.user_metadata?.subdivision || null,
          city: user.user_metadata?.city || 'Soweto',
          postal_code: user.user_metadata?.postal_code || null
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user address:', error);
      return null;
    }
  }, []);

  // Optimized data loading with lazy loading for transactions
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    // Load critical data first (address and non-PET balance)
    setDashboardData(prev => ({ ...prev, addressLoading: true }));
    
    try {
      // Add a soft timeout to non-PET total to avoid blocking UI
      const softTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) => new Promise<T>((resolve) => {
        let settled = false;
        const t = setTimeout(() => { if (!settled) { settled = true; resolve(fallback); } }, ms);
        p.then(v => { if (!settled) { settled = true; clearTimeout(t); resolve(v); } })
         .catch(() => { if (!settled) { settled = true; clearTimeout(t); resolve(fallback); } });
      });

      const [nonPetData, addressData] = await Promise.allSettled([
        softTimeout(WorkingWalletService.getNonPetApprovedTotal(user.id), 1500, 0),
        loadUserAddress(user.id)
      ]);

      // Process non-PET balance
      if (nonPetData.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, nonPetBalance: nonPetData.value }));
      }

      // Process address data
      if (addressData.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, userAddress: addressData.value, addressLoading: false }));
      } else {
        setDashboardData(prev => ({ ...prev, userAddress: null, addressLoading: false }));
      }

      // Mark initial load as complete
      setIsInitialLoadComplete(true);

    } catch (error) {
      console.error('Error loading critical dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        addressLoading: false
      }));
      setIsInitialLoadComplete(true);
    }
  }, [user?.id, loadUserAddress]);

  // Handle app visibility changes (lock/unlock scenarios)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsAppVisible(isVisible);
      
      if (isVisible) {
        console.log('App became visible, checking dashboard state...');
        // Ensure clean state when app becomes visible
        
        if (user?.id && !isInitialLoadComplete) {
          // App became visible and we have a user but initial load isn't complete
          // This can happen after phone unlock - trigger data reload
          console.log('App became visible, reloading dashboard data...');
          // Defer reload slightly to avoid race conditions on resume
          setTimeout(() => {
            loadDashboardData();
          }, 300);
        } else if (user?.id && isInitialLoadComplete) {
          // App became visible and we're already loaded, just ensure we're not stuck
          console.log('App became visible, dashboard already loaded');
        }
      }
    };

    // Listen for visibility changes only to avoid SPA navigation loops
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isInitialLoadComplete, loadDashboardData]);

  // Simple loading timeout that always completes
  useEffect(() => {
    const simpleTimeout = setTimeout(() => {
      console.log('Dashboard: Simple loading timeout - forcing completion');
      setSimpleLoading(false);
      setIsInitialLoadComplete(true);
    }, 3000); // 3 second simple timeout
    
    return () => {
      clearTimeout(simpleTimeout);
    };
  }, []); // Empty dependency array - runs only once

  useEffect(() => {
    if (!user?.id) return;
    
    loadDashboardData();
    
    return () => {
      // no-op
    };
  }, [user?.id]); // Only depend on user?.id to prevent infinite loops

  // Lazy load transactions after initial render
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) return;
      
      setDashboardData(prev => ({ ...prev, recentLoading: true }));
      
      try {
        const txData = await WorkingWalletService.getTransactionHistory(user.id, 5);
        const safeTx = Array.isArray(txData) ? txData : [];
        const sum = safeTx.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        
        setDashboardData(prev => ({
          ...prev,
          allTransactions: safeTx,
          computedBalance: Number(sum.toFixed(2)),
          recentLoading: false,
          recentError: null
        }));
      } catch (error) {
        console.error('Error loading transactions:', error);
        setDashboardData(prev => ({
          ...prev,
          allTransactions: [],
          computedBalance: null,
          recentLoading: false,
          recentError: 'Failed to load recent activity'
        }));
      }
    };

    // Load transactions after a short delay to prioritize critical data
    const timer = setTimeout(loadTransactions, 100);
    return () => clearTimeout(timer);
  }, [user?.id]);

  // Optimized wallet refresh effect
  useEffect(() => {
    if (user?.id && refreshWallet && typeof refreshWallet === 'function') {
      const timer = setTimeout(() => {
        refreshWallet();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, refreshWallet]);

  // Memoize format functions to prevent recreation on every render
  const formatDate = useCallback((iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  }, []);

  const formatAmount = useCallback((amount: number) => {
    const val = Number(amount) || 0;
    return `${val >= 0 ? '+' : '-'}R ${Math.abs(val).toFixed(2)}`;
  }, []);

  const getTxIcon = useCallback((amount: number) => {
    const val = Number(amount) || 0;
    return val >= 0 ? (
      <div className="p-2 bg-success/20 rounded-lg"><Recycle className="h-4 w-4 text-success" /></div>
    ) : (
      <div className="p-2 bg-primary/20 rounded-lg"><ArrowDownRight className="h-4 w-4 text-primary" /></div>
    );
  }, []);

  // Collection scheduling
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const nextCollectionDate = "2025-08-12";
  const nextCollectionTime = "09:00 - 12:00";
  
  // Memoize address calculations to prevent re-computation
  const nextCollectionArea = useMemo(() => {
    if (dashboardData.addressLoading) return "Loading address...";
    if (!dashboardData.userAddress) return "Address not available in current schema";
    
    const userAddress = dashboardData.userAddress;
    
    // If using user_addresses structure
    if (userAddress.address_line1) {
      return AddressService.formatAddress({
        street_addr: userAddress.address_line1,
        subdivision: userAddress.address_line2 || '',
        township_name: '',
        city: userAddress.city,
        postal_code: userAddress.postal_code
      });
    }

    const { street_addr, subdivision, city, postal_code, township_name } = userAddress as any;

    if ((street_addr || subdivision || city || postal_code) && city) {
      const townshipName = township_name || '';
      return `${street_addr || ''}${subdivision ? ', ' + subdivision : ''}${townshipName ? ', ' + townshipName : ''}${city ? ', ' + city : ''}${postal_code ? ' ' + postal_code : ''}`
        .replace(/^,\s*|,\s*,/g, ', ')
        .trim()
        .replace(/^,\s*/, '');
    }

    if (city) return `${city}`;
    return "Address not available in current schema";
  }, [dashboardData.addressLoading, dashboardData.userAddress]);

  const addressFields = useMemo(() => {
    if (dashboardData.addressLoading || !dashboardData.userAddress) {
      return { street_addr: '', township_name: '', subdivision: '', city: '', postal_code: '' } as {
        street_addr: string;
        township_name: string;
        subdivision: string;
        city: string;
        postal_code: string;
      };
    }
    const ua = dashboardData.userAddress as any;
    const street = ua.address_line1 || ua.street_addr || '';
    const subdivision = ua.address_line2 || ua.subdivision || '';
    const townshipName = ua.township_name || '';
    const city = ua.city || '';
    const postal = ua.postal_code || '';
    return { street_addr: street, township_name: townshipName, subdivision, city, postal_code: postal };
  }, [dashboardData.addressLoading, dashboardData.userAddress]);
  
  // Memoize address validation to prevent re-computation
  const hasAddress = useMemo(() => !!(
    (dashboardData.userAddress && (dashboardData.userAddress as any).address_line1 && (dashboardData.userAddress as any).city) ||
    (dashboardData.userAddress && (dashboardData.userAddress as any).street_addr && (dashboardData.userAddress as any).city)
  ), [dashboardData.userAddress]);

  const handleBookCollection = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    setShowBookingModal(false);
    // Here you would typically call an API to book the collection
    alert(`Collection booked for ${selectedDate}`);
  };

  // Debug logging to see what's happening (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard Debug - Wallet Values:', {
      walletBalance: safeWalletBalance,
      displayBalance,
      totalPoints: safeTotalPoints,
      tier: safeUserTier,
      totalWeightKg: safeTotalWeightKg,
      walletLoading,
      error: walletError,
      isInitialLoadComplete
    });
  }

  // Don't render early return - this violates hooks rules
  // Instead, we'll show loading state in the JSX

  // Memoize refresh function to prevent recreation
  const handleRefreshBalance = useCallback(() => {
    if (refreshWallet && typeof refreshWallet === 'function') {
      refreshWallet();
    }
  }, [refreshWallet]);

  // Memoized transaction renderer for virtual scrolling - Mobile Optimized
  const renderTransaction = useCallback((transaction: any, index: number) => (
    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
          {getTxIcon(transaction.amount)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
            {transaction.description || (Number(transaction.amount) >= 0 ? 'Collection approved' : 'Withdrawal')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {transaction.material_type ? `${transaction.material_type}` : ''}
            {transaction.kgs ? `${transaction.material_type ? ' • ' : ''}${Number(transaction.kgs).toFixed(1)} kg` : ''}
            {` ${formatDate(transaction.approved_at || transaction.updated_at || transaction.created_at)}`}
          </p>
        </div>
      </div>
      <p className={`text-sm font-bold flex-shrink-0 ml-2 ${Number(transaction.amount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {formatAmount(Number(transaction.amount) || 0)}
      </p>
    </div>
  ), [getTxIcon, formatDate, formatAmount]);

  return (
    <div className="relative pb-20 px-3 py-4 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Show loading spinner if initial load is not complete and app is visible */}
      {simpleLoading || (!isInitialLoadComplete && isAppVisible) ? (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner fullScreen text="Loading dashboard..." />
        </div>
      ) : !isAppVisible ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">App is in background...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header - Mobile Optimized */}
          <div className="text-center space-y-2 pt-3">
            <div className="flex justify-center items-center">
              <Logo className="h-20 w-auto max-w-[280px]" alt="Woza Mali Logo" variant="woza-mali" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Welcome, Sebenza Mngqi!
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Powered by Sebenza Nathi Waste</p>
            </div>
          </div>

      {/* Wallet Balance Card - Mobile Optimized */}
      <Card className="border-0 shadow-2xl wallet-card dark:wallet-card-dark">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm opacity-90 mb-2 font-medium">Wallet Balance</p>
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-white/20 rounded-lg mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-24"></div>
                </div>
              ) : walletError ? (
                <div>
                  <p className="text-xl font-bold text-red-100">Error</p>
                  <p className="text-xs opacity-75 mt-1">Failed to load balance</p>
                  <button
                    onClick={() => {
                      if (refreshWallet && typeof refreshWallet === 'function') {
                        refreshWallet();
                      }
                    }}
                    className="text-xs text-blue-100 underline hover:text-blue-50 mt-2 px-2 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">R {displayBalance.toFixed(2)}</p>
                  <p className="text-xs opacity-90">
                    {displayBalance === 0 ? 'Complete pickups to earn!' : 'Available for withdrawal'}
                  </p>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recycling Level & Impact - Mobile Optimized */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-base font-bold text-green-900">{safeUserTier.charAt(0).toUpperCase() + safeUserTier.slice(1)} Recycler</h3>
              <p className="text-sm text-green-700 font-medium">{safeTotalWeightKg} kg recycled</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Recycle className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-700 font-medium">Progress to {safeNextTierRequirements.nextTier ? `${safeNextTierRequirements.nextTier.charAt(0).toUpperCase() + safeNextTierRequirements.nextTier.slice(1)}` : 'Max Level'}</span>
              <span className="font-bold text-green-800">{safeNextTierRequirements.weightNeeded} kg to go</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${safeNextTierRequirements.progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CO2 Impact & Monthly Growth - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">CO₂ Saved</p>
                <p className="text-lg font-bold text-blue-900">{co2Saved.toFixed(1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-medium">Total Weight</p>
                  <p className="text-lg font-bold text-emerald-900">{safeTotalWeightKg.toFixed(1)} kg</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            onClick={() => navigate.push('/withdrawal')}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Withdraw</span>
          </Button>
          <Button 
            className="h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            onClick={() => navigate.push('/guides')}
          >
            <Recycle className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Guide</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            onClick={() => navigate.push('/rewards')}
          >
            <Gift className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Rewards</span>
          </Button>
          
          <Button 
            className="h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            onClick={() => navigate.push('/fund')}
          >
            <Heart className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Donate</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity - Mobile Optimized */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-600 text-white rounded-t-lg p-4">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {dashboardData.recentLoading ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-xs">Loading recent activity...</p>
            </div>
          ) : dashboardData.recentError ? (
            <div className="text-center py-6 text-red-500 dark:text-red-400">
              <div className="text-red-500 text-3xl mb-2">⚠️</div>
              <p className="text-xs">{dashboardData.recentError}</p>
            </div>
          ) : dashboardData.allTransactions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="text-gray-400 dark:text-gray-500 text-3xl mb-2">📊</div>
              <p className="text-xs font-medium">No recent activity yet</p>
              <p className="text-xs">Complete your first collection to see activity here</p>
            </div>
          ) : (
            <VirtualizedTransactionList
              transactions={dashboardData.allTransactions}
              renderTransaction={renderTransaction}
              itemHeight={60}
              containerHeight={180}
              overscan={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Collection Schedule - Mobile Optimized */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-3xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 text-white p-4">
          <CardTitle className="text-base font-bold flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Calendar className="h-4 w-4" />
            </div>
            Next Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Collection Info Card - Mobile Optimized */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                  <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Collection Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{nextCollectionDate}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Time Slot</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{nextCollectionTime}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {nextCollectionArea}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Badge - Mobile Optimized */}
            {!hasAddress ? (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Address Required</p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Complete your profile with address information to enable collection booking
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-medium text-green-800 dark:text-green-200">Ready for Collection</p>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  ✓ Collection address confirmed
                </p>
              </div>
            )}
          </div>
          
          {/* Action Buttons - Mobile Optimized */}
          <div className="space-y-2">
            <Button 
              className="w-full h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleBookCollection(nextCollectionDate)}
              disabled={!hasAddress}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {hasAddress ? "Book Collection" : "Address Required"}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-10 border-2 border-gray-300 dark:border-gray-600 hover:border-yellow-500 dark:hover:border-yellow-400 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
              onClick={() => navigate.push('/collections')}
            >
              <Clock className="h-4 w-4 mr-2" />
              View All Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking Confirmation Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Collection Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book a collection for {selectedDate}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-secondary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Collection Details</p>
              <p className="font-medium">Date: {selectedDate}</p>
              <p className="font-medium">Time: {nextCollectionTime}</p>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Collection Address:</p>
                  <p className="font-medium">{nextCollectionArea}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1"
                onClick={confirmBooking}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
});

export default Dashboard;