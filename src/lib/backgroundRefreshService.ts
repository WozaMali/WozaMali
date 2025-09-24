import { getWalletCache, saveWalletCache } from './session-utils'
import { WorkingWalletService } from './workingWalletService'

class BackgroundRefreshService {
  private static instance: BackgroundRefreshService
  private refreshIntervals = new Map<string, NodeJS.Timeout>()
  private isRefreshing = new Map<string, boolean>()
  
  // Refresh intervals (in milliseconds)
  private readonly WALLET_REFRESH_INTERVAL = 30 * 1000 // 30 seconds
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

  static getInstance(): BackgroundRefreshService {
    if (!BackgroundRefreshService.instance) {
      BackgroundRefreshService.instance = new BackgroundRefreshService()
    }
    return BackgroundRefreshService.instance
  }

  /**
   * Start background refresh for a user
   */
  startBackgroundRefresh(userId: string): void {
    if (!userId) return

    // Clear existing interval if any
    this.stopBackgroundRefresh(userId)

    console.log('Starting background refresh for user:', userId)

    // Start immediate refresh
    this.refreshWalletData(userId)

    // Set up interval for periodic refresh
    const interval = setInterval(() => {
      this.refreshWalletData(userId)
    }, this.WALLET_REFRESH_INTERVAL)

    this.refreshIntervals.set(userId, interval)
  }

  /**
   * Stop background refresh for a user
   */
  stopBackgroundRefresh(userId: string): void {
    const interval = this.refreshIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      this.refreshIntervals.delete(userId)
      console.log('Stopped background refresh for user:', userId)
    }
  }

  /**
   * Refresh wallet data in background
   */
  private async refreshWalletData(userId: string): Promise<void> {
    if (!userId || this.isRefreshing.get(userId)) {
      return
    }

    this.isRefreshing.set(userId, true)

    try {
      console.log('Background refreshing wallet data for user:', userId)
      
      // Check if we need to refresh (cache is older than 2 minutes)
      const cached = getWalletCache(userId)
      if (cached) {
        const cacheTime = cached._cacheTime || 0
        const now = Date.now()
        
        if (now - cacheTime < this.CACHE_DURATION) {
          console.log('Wallet data is fresh, skipping background refresh')
          return
        }
      }

      // Fetch fresh data
      const workingData = await WorkingWalletService.getWalletData(userId)
      
      // Convert to wallet format
      const walletData = {
        balance: workingData.balance,
        points: workingData.points,
        tier: workingData.tier,
        totalEarnings: workingData.balance,
        environmentalImpact: workingData.environmentalImpact,
        tierBenefits: this.getTierBenefits(workingData.tier),
        nextTierRequirements: workingData.nextTierRequirements,
        totalPickups: workingData.collectionSummary.total_pickups,
        approvedPickups: workingData.collectionSummary.total_pickups,
        pendingPickups: 0,
        rejectedPickups: 0,
        totalWeightKg: workingData.totalWeightKg,
        _cacheTime: Date.now()
      }

      // Save to cache
      saveWalletCache(userId, walletData)
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('wallet-data-refreshed', {
        detail: { userId, data: walletData }
      }))

      console.log('Background wallet refresh completed for user:', userId)
    } catch (error) {
      console.error('Background wallet refresh failed for user:', userId, error)
    } finally {
      this.isRefreshing.set(userId, false)
    }
  }

  /**
   * Get tier benefits
   */
  private getTierBenefits(tier: string): string[] {
    const benefits: Record<string, string[]> = {
      bronze: ['Basic rewards', 'Standard support'],
      silver: ['Enhanced rewards', 'Priority support', 'Bonus points'],
      gold: ['Premium rewards', 'VIP support', 'Double points', 'Exclusive offers'],
      platinum: ['Ultimate rewards', '24/7 support', 'Triple points', 'Exclusive access', 'Personal manager']
    }
    return benefits[tier as keyof typeof benefits] || benefits.bronze
  }

  /**
   * Force immediate refresh
   */
  async forceRefresh(userId: string): Promise<void> {
    if (!userId) return

    console.log('Force refreshing wallet data for user:', userId)
    this.isRefreshing.set(userId, false) // Reset flag
    await this.refreshWalletData(userId)
  }

  /**
   * Check if user is being refreshed
   */
  isUserRefreshing(userId: string): boolean {
    return this.isRefreshing.get(userId) || false
  }

  /**
   * Cleanup all intervals
   */
  cleanup(): void {
    this.refreshIntervals.forEach((interval, userId) => {
      clearInterval(interval)
      console.log('Cleaned up background refresh for user:', userId)
    })
    this.refreshIntervals.clear()
    this.isRefreshing.clear()
  }
}

export const backgroundRefreshService = BackgroundRefreshService.getInstance()
export default backgroundRefreshService
