// Service Worker Cleanup Utility
// This utility completely removes all service workers and clears their caches

export const cleanupServiceWorkers = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Skip in non-secure contexts (file://) and on Capacitor native
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      return;
    }
  } catch {}
  if (!window.isSecureContext) {
    return;
  }

  try {
    console.log('🧹 Starting service worker cleanup...');
    
    // Get all service worker registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('✅ No service workers found to clean up');
      return;
    }

    console.log(`🗑️ Found ${registrations.length} service worker(s) to unregister`);

    // Unregister all service workers
    for (const registration of registrations) {
      try {
        await registration.unregister();
        console.log('✅ Unregistered service worker:', registration.scope);
        
        // Clear all caches for this registration
        if (registration.scope) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (cacheName.includes('wozamali') || cacheName.includes('sw')) {
              await caches.delete(cacheName);
              console.log('🗑️ Deleted cache:', cacheName);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error unregistering service worker:', error);
      }
    }

    // Clear all caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      try {
        await caches.delete(cacheName);
        console.log('🗑️ Deleted cache:', cacheName);
      } catch (error) {
        console.error('❌ Error deleting cache:', cacheName, error);
      }
    }

    console.log('✅ Service worker cleanup completed');
  } catch (error) {
    console.error('❌ Service worker cleanup failed:', error);
  }
};

// Force cleanup on page load
if (typeof window !== 'undefined') {
  // Run cleanup immediately
  cleanupServiceWorkers();
  
  // Also run cleanup after a short delay to catch any late registrations
  setTimeout(cleanupServiceWorkers, 1000);
}
