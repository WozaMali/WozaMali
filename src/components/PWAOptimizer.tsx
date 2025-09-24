'use client'

import { useEffect } from 'react'
import { useOptimizedPWA } from '@/hooks/useOptimizedPWA'

interface PWAOptimizerProps {
  children: React.ReactNode
}

export default function PWAOptimizer({ children }: PWAOptimizerProps) {
  const { 
    isOnline, 
    updateAvailable, 
    isUpdating, 
    updateApp, 
    refreshCache 
  } = useOptimizedPWA()

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('PWA: Back online, refreshing data...')
      // Trigger wallet refresh when back online
      window.dispatchEvent(new CustomEvent('pwa-online'))
    }

    const handleOffline = () => {
      console.log('PWA: Gone offline')
      // Show offline indicator
      window.dispatchEvent(new CustomEvent('pwa-offline'))
    }

    const handleCacheUpdated = () => {
      console.log('PWA: Cache updated, refreshing data...')
      // Trigger data refresh when cache is updated
      window.dispatchEvent(new CustomEvent('cache-updated'))
    }

    window.addEventListener('pwa-online', handleOnline)
    window.addEventListener('pwa-offline', handleOffline)
    window.addEventListener('cache-updated', handleCacheUpdated)

    return () => {
      window.removeEventListener('pwa-online', handleOnline)
      window.removeEventListener('pwa-offline', handleOffline)
      window.removeEventListener('cache-updated', handleCacheUpdated)
    }
  }, [])

  // Handle app updates
  useEffect(() => {
    if (updateAvailable && !isUpdating) {
      console.log('PWA: Update available, prompting user...')
      // You can show a toast or banner here to notify user of update
      window.dispatchEvent(new CustomEvent('pwa-update-available'))
    }
  }, [updateAvailable, isUpdating])

  // Auto-update when update is available (optional)
  useEffect(() => {
    if (updateAvailable && !isUpdating) {
      // Auto-update after a short delay
      const timer = setTimeout(() => {
        updateApp()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [updateAvailable, isUpdating, updateApp])

  // Handle visibility change (app focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('PWA: App became visible, refreshing data...')
        // Trigger data refresh when app becomes visible
        window.dispatchEvent(new CustomEvent('pwa-visible'))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Handle page focus/blur
  useEffect(() => {
    const handleFocus = () => {
      console.log('PWA: Window focused, refreshing data...')
      window.dispatchEvent(new CustomEvent('pwa-focused'))
    }

    const handleBlur = () => {
      console.log('PWA: Window blurred')
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Update available indicator */}
      {updateAvailable && !isUpdating && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium z-50">
          Update available. Refreshing...
        </div>
      )}

      {/* Updating indicator */}
      {isUpdating && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-medium z-50">
          Updating app...
        </div>
      )}

      {children}
    </>
  )
}
