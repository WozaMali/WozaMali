'use client'

import { useEffect, useState, useCallback } from 'react'

interface OptimizedPWAState {
  isInstalled: boolean
  isOnline: boolean
  isServiceWorkerSupported: boolean
  isServiceWorkerRegistered: boolean
  updateAvailable: boolean
  isUpdating: boolean
}

export function useOptimizedPWA() {
  const [pwaState, setPwaState] = useState<OptimizedPWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isServiceWorkerRegistered: false,
    updateAvailable: false,
    isUpdating: false
  })

  // Check if app is installed
  const checkInstallStatus = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    
    setPwaState(prev => ({
      ...prev,
      isInstalled: isStandalone || isIOSStandalone
    }))
  }, [])

  // Handle online/offline status
  const handleOnline = useCallback(() => {
    setPwaState(prev => ({ ...prev, isOnline: true }))
    // Trigger wallet refresh when coming back online
    window.dispatchEvent(new CustomEvent('pwa-online'))
  }, [])

  const handleOffline = useCallback(() => {
    setPwaState(prev => ({ ...prev, isOnline: false }))
    // Show offline indicator
    window.dispatchEvent(new CustomEvent('pwa-offline'))
  }, [])

  // Register service worker with optimized caching
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })
      
      console.log('Service Worker registered successfully:', registration)
      
      setPwaState(prev => ({
        ...prev,
        isServiceWorkerRegistered: true
      }))

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPwaState(prev => ({
                ...prev,
                updateAvailable: true
              }))
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated, refreshing data...')
          window.dispatchEvent(new CustomEvent('cache-updated'))
        }
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }, [])

  // Handle app installation
  const handleAppInstalled = useCallback(() => {
    setPwaState(prev => ({
      ...prev,
      isInstalled: true
    }))
    console.log('PWA installed successfully')
  }, [])

  // Update the app
  const updateApp = useCallback(async () => {
    if (!pwaState.updateAvailable) return

    setPwaState(prev => ({ ...prev, isUpdating: true }))

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Wait a bit for the new service worker to take control
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } catch (error) {
      console.error('Failed to update app:', error)
      setPwaState(prev => ({ ...prev, isUpdating: false }))
    }
  }, [pwaState.updateAvailable])

  // Force refresh cache
  const refreshCache = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        // Clear all caches
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        
        // Unregister and re-register service worker
        await registration.unregister()
        await registerServiceWorker()
        
        console.log('Cache refreshed successfully')
        window.dispatchEvent(new CustomEvent('cache-refreshed'))
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error)
    }
  }, [registerServiceWorker])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // Show notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!pwaState.isServiceWorkerRegistered) {
      console.log('Service Worker not registered')
      return
    }

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          silent: false,
          ...options
        })
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }, [pwaState.isServiceWorkerRegistered, requestNotificationPermission])

  // Initialize PWA
  useEffect(() => {
    // Initial checks
    checkInstallStatus()
    registerServiceWorker()

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: mediaQuery.matches
      }))
    }
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [checkInstallStatus, registerServiceWorker, handleOnline, handleOffline, handleAppInstalled])

  return {
    ...pwaState,
    updateApp,
    refreshCache,
    requestNotificationPermission,
    showNotification
  }
}
