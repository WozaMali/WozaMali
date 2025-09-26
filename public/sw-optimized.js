// Optimized Service Worker for WozaMali
const CACHE_NAME = 'wozamali-v1';
const STATIC_CACHE = 'wozamali-static-v1';
const DYNAMIC_CACHE = 'wozamali-dynamic-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching critical resources...');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('✅ Critical resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Failed to cache critical resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try cache first for static resources
    if (isStaticResource(url.pathname)) {
      const cachedResponse = await getFromCache(request, STATIC_CACHE);
      if (cachedResponse) {
        console.log('📦 Serving from static cache:', url.pathname);
        return cachedResponse;
      }
    }

    // Try network with timeout
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse && networkResponse.ok) {
      // Cache successful responses
      await cacheResponse(request, networkResponse);
      console.log('🌐 Served from network:', url.pathname);
      return networkResponse;
    }

    // Fallback to cache
    const cachedResponse = await getFromCache(request, DYNAMIC_CACHE);
    if (cachedResponse) {
      console.log('📦 Serving from dynamic cache:', url.pathname);
      return cachedResponse;
    }

    // Final fallback to offline page
    if (url.pathname.startsWith('/')) {
      return caches.match('/offline.html');
    }

    throw new Error('No response available');
  } catch (error) {
    console.error('❌ Fetch error:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getFromCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    return await cache.match(request);
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Only cache successful responses
    if (response.status === 200) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

function isStaticResource(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'wallet-sync') {
    event.waitUntil(handleWalletSync());
  } else if (event.tag === 'collection-sync') {
    event.waitUntil(handleCollectionSync());
  }
});

async function handleWalletSync() {
  try {
    console.log('💰 Syncing wallet data...');
    
    // Get pending wallet updates from IndexedDB
    const pendingUpdates = await getPendingWalletUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await syncWalletUpdate(update);
        await removePendingWalletUpdate(update.id);
      } catch (error) {
        console.error('Failed to sync wallet update:', error);
      }
    }
    
    console.log('✅ Wallet sync completed');
  } catch (error) {
    console.error('❌ Wallet sync failed:', error);
  }
}

async function handleCollectionSync() {
  try {
    console.log('📦 Syncing collection data...');
    
    // Get pending collections from IndexedDB
    const pendingCollections = await getPendingCollections();
    
    for (const collection of pendingCollections) {
      try {
        await syncCollection(collection);
        await removePendingCollection(collection.id);
      } catch (error) {
        console.error('Failed to sync collection:', error);
      }
    }
    
    console.log('✅ Collection sync completed');
  } catch (error) {
    console.error('❌ Collection sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New update available',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'wozamali-notification',
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'WozaMali', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('✅ URLs cached successfully');
  } catch (error) {
    console.error('❌ Failed to cache URLs:', error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
}

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    return status;
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
    return {};
  }
}

// IndexedDB helpers (simplified)
async function getPendingWalletUpdates() {
  // Implementation would depend on your IndexedDB structure
  return [];
}

async function syncWalletUpdate(update) {
  // Implementation for syncing wallet updates
  console.log('Syncing wallet update:', update);
}

async function removePendingWalletUpdate(id) {
  // Implementation for removing synced updates
  console.log('Removing pending wallet update:', id);
}

async function getPendingCollections() {
  // Implementation would depend on your IndexedDB structure
  return [];
}

async function syncCollection(collection) {
  // Implementation for syncing collections
  console.log('Syncing collection:', collection);
}

async function removePendingCollection(id) {
  // Implementation for removing synced collections
  console.log('Removing pending collection:', id);
}
