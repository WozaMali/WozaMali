import { useEffect, useCallback } from 'react'
import { backgroundRefreshService } from '@/lib/backgroundRefreshService'

export function useBackgroundRefresh(userId?: string) {
  // Start background refresh when user is available
  useEffect(() => {
    if (!userId) return

    console.log('Starting background refresh for user:', userId)
    backgroundRefreshService.startBackgroundRefresh(userId)

    return () => {
      console.log('Stopping background refresh for user:', userId)
      backgroundRefreshService.stopBackgroundRefresh(userId)
    }
  }, [userId])

  // Listen for wallet data refresh events
  useEffect(() => {
    if (!userId) return

    const handleWalletRefresh = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        console.log('Received wallet data refresh event for user:', userId)
        // You can dispatch this to update components if needed
        window.dispatchEvent(new CustomEvent('wallet-updated', {
          detail: event.detail
        }))
      }
    }

    window.addEventListener('wallet-data-refreshed', handleWalletRefresh as EventListener)

    return () => {
      window.removeEventListener('wallet-data-refreshed', handleWalletRefresh as EventListener)
    }
  }, [userId])

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    if (!userId) return
    await backgroundRefreshService.forceRefresh(userId)
  }, [userId])

  // Check if refreshing
  const isRefreshing = useCallback(() => {
    if (!userId) return false
    return backgroundRefreshService.isUserRefreshing(userId)
  }, [userId])

  return {
    forceRefresh,
    isRefreshing: isRefreshing()
  }
}
