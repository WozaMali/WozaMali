import { getWalletCache, saveWalletCache, clearWalletCache } from './session-utils'
import { WorkingWalletService } from './workingWalletService'

interface WalletRefreshOptions {
  userId: string
  forceRefresh?: boolean
  timeout?: number
  retries?: number
}

interface WalletRefreshResult {
  success: boolean
  data?: any
  error?: string
  fromCache?: boolean
}

class WalletRefreshService {
  private static instance: WalletRefreshService
  private refreshQueue = new Map<string, Promise<any>>()
  private lastRefresh = new Map<string, number>()
  
  // Cache settings
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
  private readonly MAX_RETRIES = 3
  private readonly DEFAULT_TIMEOUT = 5000 // 5 seconds

  static getInstance(): WalletRefreshService {
    if (!WalletRefreshService.instance) {
      WalletRefreshService.instance = new WalletRefreshService()
    }
    return WalletRefreshService.instance
  }

  /**
   * Get wallet data with smart caching and refresh logic
   */
  async getWalletData(options: WalletRefreshOptions): Promise<WalletRefreshResult> {
    const { userId, forceRefresh = false, timeout = this.DEFAULT_TIMEOUT, retries = this.MAX_RETRIES } = options

    // Check if we have a recent refresh in progress
    if (this.refreshQueue.has(userId) && !forceRefresh) {
      console.log('Wallet refresh already in progress for user:', userId)
      try {
        const result = await this.refreshQueue.get(userId)
        return { success: true, data: result, fromCache: false }
      } catch (error) {
        // If the queued request failed, continue with fresh request
      }
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getWalletCache(userId)
      if (cached) {
        const lastRefreshTime = this.lastRefresh.get(userId) || 0
        const now = Date.now()
        
        if (now - lastRefreshTime < this.CACHE_DURATION) {
          console.log('Returning cached wallet data for user:', userId)
          return { success: true, data: cached, fromCache: true }
        }
      }
    }

    // Create refresh promise
    const refreshPromise = this.performRefresh(userId, timeout, retries)
    this.refreshQueue.set(userId, refreshPromise)

    try {
      const data = await refreshPromise
      this.lastRefresh.set(userId, Date.now())
      saveWalletCache(userId, data)
      
      return { success: true, data, fromCache: false }
    } catch (error: any) {
      console.error('Wallet refresh failed for user:', userId, error)
      
      // Return cached data if available, even if stale
      const cached = getWalletCache(userId)
      if (cached) {
        console.log('Returning stale cached data due to refresh failure')
        return { success: true, data: cached, fromCache: true }
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to refresh wallet data' 
      }
    } finally {
      this.refreshQueue.delete(userId)
    }
  }

  /**
   * Perform the actual refresh with retry logic
   */
  private async performRefresh(userId: string, timeout: number, retries: number): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Wallet refresh attempt ${attempt}/${retries} for user:`, userId)
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        })

        // Create refresh promise
        const refreshPromise = WorkingWalletService.getWalletData(userId)

        // Race between refresh and timeout
        const data = await Promise.race([refreshPromise, timeoutPromise])
        
        console.log(`Wallet refresh successful on attempt ${attempt}`)
        return data
      } catch (error: any) {
        lastError = error
        console.warn(`Wallet refresh attempt ${attempt} failed:`, error.message)
        
        // Don't retry on certain errors
        if (error.message.includes('timeout') || error.message.includes('network')) {
          // Wait before retry
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        } else {
          // Don't retry on other errors
          break
        }
      }
    }

    throw lastError || new Error('All refresh attempts failed')
  }

  /**
   * Force refresh wallet data
   */
  async forceRefresh(userId: string): Promise<WalletRefreshResult> {
    console.log('Force refreshing wallet data for user:', userId)
    clearWalletCache()
    this.lastRefresh.delete(userId)
    
    return this.getWalletData({ userId, forceRefresh: true })
  }

  /**
   * Clear all cached data for a user
   */
  clearUserCache(userId: string): void {
    clearWalletCache()
    this.lastRefresh.delete(userId)
    this.refreshQueue.delete(userId)
  }

  /**
   * Get refresh status for a user
   */
  isRefreshing(userId: string): boolean {
    return this.refreshQueue.has(userId)
  }

  /**
   * Get last refresh time for a user
   */
  getLastRefreshTime(userId: string): number | null {
    return this.lastRefresh.get(userId) || null
  }
}

export const walletRefreshService = WalletRefreshService.getInstance()
export default walletRefreshService
