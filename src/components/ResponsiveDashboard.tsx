'use client'

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Wallet, 
  Trophy, 
  Leaf, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Weight,
  Coins,
  Star
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useResponsiveWallet } from '@/hooks/useResponsiveWallet'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { WorkingWalletService } from '@/lib/workingWalletService'

// Loading skeleton component
const WalletSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <Skeleton className="h-8 w-24" />
      </div>
      <p className="text-xs text-muted-foreground">
        <Skeleton className="h-3 w-32 mt-1" />
      </p>
    </CardContent>
  </Card>
)

// Error state component
const WalletError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="w-full border-destructive">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-destructive">Wallet Error</CardTitle>
      <AlertCircle className="h-4 w-4 text-destructive" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-destructive">Unable to load</div>
      <p className="text-xs text-muted-foreground mt-1">{error}</p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="mt-2"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </CardContent>
  </Card>
)

// Main dashboard component
const ResponsiveDashboard = memo(() => {
  const navigate = useRouter()
  const { logMetrics } = usePerformanceMonitor('ResponsiveDashboard')
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext
  try {
    authContext = useAuth()
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { user } = authContext
  
  // Use the responsive wallet hook
  const { 
    balance: walletBalance, 
    points: totalPoints,
    tier: userTier,
    totalEarnings,
    environmentalImpact,
    nextTierRequirements,
    totalWeightKg,
    loading: walletLoading,
    error: walletError,
    refreshWallet,
    forceRefresh,
    isInitialized
  } = useResponsiveWallet(user?.id)

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    recentTransactions: [] as any[],
    recentLoading: false,
    recentError: null as string | null
  })

  // Memoize safe values to prevent unnecessary re-renders
  const safeWalletBalance = useMemo(() => walletBalance || 0, [walletBalance])
  const safeTotalPoints = useMemo(() => totalPoints || 0, [totalPoints])
  const safeUserTier = useMemo(() => userTier || 'bronze', [userTier])
  const safeTotalWeightKg = useMemo(() => totalWeightKg || 0, [totalWeightKg])
  const safeEnvironmentalImpact = useMemo(() => environmentalImpact || {
    co2_saved_kg: 0,
    water_saved_liters: 0,
    landfill_saved_kg: 0
  }, [environmentalImpact])
  const safeNextTierRequirements = useMemo(() => nextTierRequirements || {
    nextTier: 'silver',
    weightNeeded: 20,
    progressPercentage: 0
  }, [nextTierRequirements])

  // Load recent transactions (non-blocking)
  const loadRecentTransactions = useCallback(async () => {
    if (!user?.id) return
    
    setDashboardData(prev => ({ ...prev, recentLoading: true, recentError: null }))
    
    try {
      const txData = await WorkingWalletService.getTransactionHistory(user.id, 5)
      const safeTx = Array.isArray(txData) ? txData : []
      
      setDashboardData(prev => ({
        ...prev,
        recentTransactions: safeTx,
        recentLoading: false,
        recentError: null
      }))
    } catch (error) {
      console.error('Error loading transactions:', error)
      setDashboardData(prev => ({
        ...prev,
        recentTransactions: [],
        recentLoading: false,
        recentError: 'Failed to load recent activity'
      }))
    }
  }, [user?.id])

  // Load transactions after wallet is initialized
  useEffect(() => {
    if (isInitialized && user?.id) {
      // Small delay to not block initial render
      const timer = setTimeout(loadRecentTransactions, 100)
      return () => clearTimeout(timer)
    }
  }, [isInitialized, user?.id, loadRecentTransactions])

  // Memoize format functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await forceRefresh()
    await loadRecentTransactions()
  }, [forceRefresh, loadRecentTransactions])

  // Performance logging
  useEffect(() => {
    if (isInitialized) {
      logMetrics({
        walletBalance: safeWalletBalance,
        userTier: safeUserTier,
        totalPoints: safeTotalPoints
      })
    }
  }, [isInitialized, safeWalletBalance, safeUserTier, safeTotalPoints, logMetrics])

  // Render wallet card based on state
  const renderWalletCard = () => {
    if (walletLoading && !isInitialized) {
      return <WalletSkeleton />
    }

    if (walletError && !isInitialized) {
      return <WalletError error={walletError} onRetry={handleRefresh} />
    }

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          <div className="flex items-center space-x-2">
            {walletLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={walletLoading}
            >
              <RefreshCw className={`h-4 w-4 ${walletLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(safeWalletBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {safeTotalPoints} points • {safeUserTier.charAt(0).toUpperCase() + safeUserTier.slice(1)} tier
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={walletLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${walletLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallet and Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderWalletCard()}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTotalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Earned from collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Collected</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTotalWeightKg.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              Total recycled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Progress</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{safeUserTier}</div>
            <p className="text-xs text-muted-foreground">
              {safeNextTierRequirements.progressPercentage}% to {safeNextTierRequirements.nextTier}
            </p>
            <Progress 
              value={safeNextTierRequirements.progressPercentage} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Leaf className="h-5 w-5 mr-2 text-green-600" />
            Environmental Impact
          </CardTitle>
          <CardDescription>
            Your contribution to a cleaner environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {safeEnvironmentalImpact.co2_saved_kg.toFixed(1)} kg
              </div>
              <p className="text-sm text-muted-foreground">CO₂ Saved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {safeEnvironmentalImpact.water_saved_liters.toFixed(1)} L
              </div>
              <p className="text-sm text-muted-foreground">Water Saved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {safeEnvironmentalImpact.landfill_saved_kg.toFixed(1)} kg
              </div>
              <p className="text-sm text-muted-foreground">Landfill Diverted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest transactions and collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : dashboardData.recentError ? (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{dashboardData.recentError}</p>
              <Button variant="outline" size="sm" onClick={loadRecentTransactions} className="mt-2">
                Retry
              </Button>
            </div>
          ) : dashboardData.recentTransactions.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardData.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {transaction.type === 'collection' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Wallet className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.type === 'collection' ? 'Collection' : 'Transaction'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {transaction.type === 'collection' ? '+' : ''}
                      {formatCurrency(transaction.amount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.points || 0} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

ResponsiveDashboard.displayName = 'ResponsiveDashboard'

export default ResponsiveDashboard
