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

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-optimized.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
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
