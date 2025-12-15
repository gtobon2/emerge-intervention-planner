// EMERGE Intervention Planner - Service Worker
const CACHE_NAME = 'emerge-v1';
const STATIC_CACHE = 'emerge-static-v1';
const DYNAMIC_CACHE = 'emerge-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Cache-first strategy for static assets
        if (isStaticAsset(url.pathname)) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', url.pathname);
            return cachedResponse;
          }

          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }

        // Network-first strategy for API calls and pages
        try {
          const networkResponse = await fetch(request);

          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] Network failed, serving from cache:', url.pathname);
            return cachedResponse;
          }

          // If page request fails and not in cache, show offline page
          if (request.headers.get('accept')?.includes('text/html')) {
            const offlinePage = await caches.match('/offline');
            if (offlinePage) {
              return offlinePage;
            }
          }

          throw error;
        }
      } catch (error) {
        console.error('[SW] Fetch failed:', error);

        // Return a basic offline response
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});

// Helper function to determine if a URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.gif',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.ico',
  ];

  return (
    staticExtensions.some((ext) => pathname.endsWith(ext)) ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/')
  );
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
