const CACHE_NAME = 'woza-mali-v1.1.0';
const STATIC_CACHE = 'woza-mali-static-v1.1.0';
const DYNAMIC_CACHE = 'woza-mali-dynamic-v1.1.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/collections',
  '/rewards',
  '/profile',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/WozaMali-uploads/w yellow.png'
];

// API routes to cache with shorter TTL
const API_ROUTES = [
  '/api/wallet',
  '/api/collections',
  '/api/rewards'
];

// Cache TTL settings (in milliseconds)
const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  DYNAMIC: 5 * 60 * 1000, // 5 minutes
  API: 2 * 60 * 1000 // 2 minutes for API calls
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network with improved strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // For API requests, use network-first strategy with cache fallback
  if (isAPIRequest(request)) {
    try {
      // Try network first for API calls
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful API responses with timestamp
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(DYNAMIC_CACHE);
        
        // Add timestamp to response headers for TTL checking
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        await cache.put(request, cachedResponse);
        return networkResponse;
      }
    } catch (error) {
      console.log('Network failed for API request, trying cache:', request.url);
    }
    
    // Fallback to cache for API requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid (within TTL)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age < CACHE_TTL.API) {
          return cachedResponse;
        }
      }
    }
    
    // Return stale cache if available, otherwise error
    return cachedResponse || new Response('Offline - API unavailable', { status: 503 });
  }
  
  // For static assets, use cache-first strategy
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network for static assets
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache static assets
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

// Helper function to check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase') ||
         url.hostname.includes('vercel');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    const pendingActions = await getPendingActions();
    for (const action of pendingActions) {
      await processPendingAction(action);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    renotify: true,
    requireInteraction: false,
    silent: false,
    tag: (data && data.data && data.data.tag) || 'woza-mali-general',
    actions: [
      { action: 'open', title: 'Open', icon: '/icons/icon-72x72.png' },
      { action: 'close', title: 'Dismiss', icon: '/icons/icon-72x72.png' }
    ]
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Woza Mali', options));
  // Inform clients that something might have changed (e.g., wallet)
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      try { client.postMessage({ type: 'wallet-maybe-updated' }); } catch (e) {}
    }
  })());
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
  if (event.action === 'close') return;
  event.waitUntil(clients.openWindow(targetUrl));
});

// Helper functions for background sync
async function getPendingActions() {
  // Placeholder for IndexedDB reads
  return [];
}

async function processPendingAction(action) {
  // Placeholder for processing queued actions
}
