'use client'

import { useEffect, useState } from 'react'

interface PWAState {
  isInstalled: boolean
  isOnline: boolean
  isServiceWorkerSupported: boolean
  isServiceWorkerRegistered: boolean
  updateAvailable: boolean
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isServiceWorkerRegistered: false,
    updateAvailable: false,
  })

  useEffect(() => {
    // Check if app is installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      setPwaState(prev => ({
        ...prev,
        isInstalled: isStandalone || isIOSStandalone
      }))
    }

    // Check online status
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }))

    // Register service worker
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported')
        return
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered successfully:', registration)
        
        setPwaState(prev => ({
          ...prev,
          isServiceWorkerRegistered: true
        }))

        // Check for updates
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

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    // Listen for app installation
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true
      }))
    }

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
  }, [])

  // Function to update the app
  const updateApp = async () => {
    if (!pwaState.updateAvailable) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update app:', error)
    }
  }

  // Function to request notification permission
  const requestNotificationPermission = async () => {
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
  }

  // Function to show notification
  const showNotification = async (title: string, options?: NotificationOptions) => {
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
          ...options
        })
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  return {
    ...pwaState,
    updateApp,
    requestNotificationPermission,
    showNotification,
  }
}
