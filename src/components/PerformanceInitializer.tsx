"use client";

import { useEffect } from 'react';
import { performanceOptimizer } from '@/lib/performanceOptimizer';
import { realtimeDataService } from '@/lib/realtimeDataService';

interface PerformanceInitializerProps {
  userId?: string;
}

export default function PerformanceInitializer({ userId }: PerformanceInitializerProps) {
  useEffect(() => {
    // Initialize performance optimizations
    console.log('🚀 Initializing performance optimizations...');
    performanceOptimizer.initialize();

    // Preload critical data if user is available
    if (userId) {
      console.log('📦 Preloading critical data for user:', userId);
      performanceOptimizer.preloadCriticalData(userId);
    }

    // Service worker registration completely disabled
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      (async () => {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            // Unregister any existing service workers on native platforms
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log('🗑️ Service Worker unregistered on native:', registration.scope);
            }
            return; // Avoid SW in native app to prevent intercepting asset requests
          }
        } catch {}
        
        // Also disable service worker on web for now to avoid asset issues
        console.log('🚫 Service Worker registration completely disabled');
        return;
      })();
    }

    // Setup real-time connection monitoring
    const checkConnectionStatus = () => {
      const status = realtimeDataService.getConnectionStatus();
      console.log('📡 Connection status:', status);
    };

    // Check connection status every 30 seconds
    const statusInterval = setInterval(checkConnectionStatus, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(statusInterval);
      console.log('🧹 Performance initializer cleanup');
    };
  }, [userId]);

  // This component doesn't render anything
  return null;
}
