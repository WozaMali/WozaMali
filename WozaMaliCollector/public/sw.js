const CACHE_NAME = 'collector-pwa-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/collector',
  '/pickups',
  '/analytics',
  '/settings',
  '/manifest.json',
  '/Collector Icon.png',
  '/favicon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept Next static/runtime assets
  if (url.pathname.startsWith('/_next/')) return;

  // Navigation requests: network-first to avoid limbo after unlock
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match(event.request)) || Response.redirect('/', 302))
    );
    return;
  }

  // Other requests: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
