"use client";

import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  Leaf, 
  Award, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Activity,
  Zap
} from 'lucide-react';
import { useOptimizedWallet } from '@/hooks/useOptimizedWallet';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

// Memoized components to prevent unnecessary re-renders
const WalletCard = memo(({ balance, points, tier, tierColor, isRealtimeConnected }: {
  balance: number;
  points: number;
  tier: string;
  tierColor: string;
  isRealtimeConnected: boolean;
}) => (
  <Card className="wallet-card">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Wallet className="h-5 w-5" />
          Wallet Balance
        </CardTitle>
        <Badge className={`${tierColor} border`}>
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-white mb-2">
        R{balance.toFixed(2)}
      </div>
      <div className="text-white/80 text-sm">
        {points.toLocaleString()} points earned
      </div>
      {isRealtimeConnected && (
        <div className="flex items-center gap-1 mt-2 text-white/70">
          <Zap className="h-3 w-3" />
          <span className="text-xs">Real-time updates active</span>
        </div>
      )}
    </CardContent>
  </Card>
));

const StatsGrid = memo(({ totalPickups, totalWeightKg, approvedPickups }: {
  totalPickups: number;
  totalWeightKg: number;
  approvedPickups: number;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Pickups</p>
            <p className="text-2xl font-bold">{totalPickups}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Weight Recycled</p>
            <p className="text-2xl font-bold">{totalWeightKg.toFixed(1)} kg</p>
          </div>
          <Leaf className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold">
              {totalPickups > 0 ? Math.round((approvedPickups / totalPickups) * 100) : 0}%
            </p>
          </div>
          <Award className="h-8 w-8 text-purple-600" />
        </div>
      </CardContent>
    </Card>
  </div>
));

const TierProgress = memo(({ nextTierRequirements, tier }: {
  nextTierRequirements: any;
  tier: string;
}) => {
  if (!nextTierRequirements.nextTier) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Progress to {nextTierRequirements.nextTier.charAt(0).toUpperCase() + nextTierRequirements.nextTier.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current: {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
            <span>{nextTierRequirements.weightNeeded} kg to go</span>
          </div>
          <Progress value={nextTierRequirements.progressPercentage} className="h-2" />
          <p className="text-xs text-gray-600">
            {nextTierRequirements.progressPercentage.toFixed(1)}% complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

const EnvironmentalImpact = memo(({ environmentalImpact }: {
  environmentalImpact: any;
}) => {
  const environmentalStats = useMemo(() => [
    {
      label: 'CO₂ Saved',
      value: `${environmentalImpact.co2_saved_kg.toFixed(1)} kg`,
      icon: Leaf,
      color: 'text-green-600'
    },
    {
      label: 'Water Saved',
      value: `${environmentalImpact.water_saved_liters.toFixed(0)} L`,
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      label: 'Landfill Saved',
      value: `${environmentalImpact.landfill_saved_kg.toFixed(1)} kg`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ], [environmentalImpact]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          Environmental Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {environmentalStats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const TierBenefits = memo(({ tierBenefits, tier }: {
  tierBenefits: string[];
  tier: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Award className="h-5 w-5" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Benefits
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tierBenefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

const OptimizedDashboardV2 = memo(() => {
  const navigate = useRouter();
  const { user } = useAuth();
  
  // Use the optimized wallet hook
  const {
    balance,
    points,
    tier,
    totalEarnings,
    environmentalImpact,
    tierBenefits,
    nextTierRequirements,
    totalPickups,
    approvedPickups,
    totalWeightKg,
    loading,
    error,
    isRealtimeConnected,
    lastUpdated,
    refreshWallet,
    forceRefresh,
    connectionStatus
  } = useRealtimeWallet(user?.id);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoized calculations
  const tierColor = useMemo(() => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800 border-amber-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      diamond: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[tier] || colors.bronze;
  }, [tier]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [forceRefresh]);

  // Auto-refresh when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('🔄 App visible, auto-refreshing...');
        refreshWallet();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, refreshWallet]);

  if (loading && !balance) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <WifiOff className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Retrying...' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with connection status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              {isRealtimeConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Live Data</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Wallet Card */}
        <WalletCard 
          balance={balance}
          points={points}
          tier={tier}
          tierColor={tierColor}
          isRealtimeConnected={isRealtimeConnected}
        />

        {/* Stats Grid */}
        <StatsGrid 
          totalPickups={totalPickups}
          totalWeightKg={totalWeightKg}
          approvedPickups={approvedPickups}
        />

        {/* Tier Progress */}
        <TierProgress 
          nextTierRequirements={nextTierRequirements}
          tier={tier}
        />

        {/* Environmental Impact */}
        <EnvironmentalImpact 
          environmentalImpact={environmentalImpact}
        />

        {/* Tier Benefits */}
        <TierBenefits 
          tierBenefits={tierBenefits}
          tier={tier}
        />

        {/* Connection Status Debug (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>Connection Status: {connectionStatus.isOnline ? 'Online' : 'Offline'}</div>
              <div>Active Subscriptions: {connectionStatus.activeSubscriptions}</div>
              <div>Real-time Connected: {isRealtimeConnected ? 'Yes' : 'No'}</div>
              <div>Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

OptimizedDashboardV2.displayName = 'OptimizedDashboardV2';

export default OptimizedDashboardV2;
