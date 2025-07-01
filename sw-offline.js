/**
 * Offline-First Service Worker for 9 Ball Scorekeeper
 * Designed specifically for airplane mode compatibility
 */

const CACHE_NAME = 'nineball-offline-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install - Cache everything immediately
self.addEventListener('install', (event) => {
  console.log('SW: Installing for offline-first operation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static files for offline use');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('SW: Installation complete - ready for offline');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Cache installation failed:', error);
      })
  );
});

// Activate - Take control immediately
self.addEventListener('activate', (event) => {
  console.log('SW: Activating offline-first mode');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Taking control of all clients');
        return self.clients.claim();
      })
  );
});

// Fetch - Offline-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('SW: Serving from cache:', url.pathname);
          return cachedResponse;
        }
        
        // Try network, cache successful responses
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                  console.log('SW: Cached for offline:', url.pathname);
                });
            }
            return response;
          })
          .catch((error) => {
            console.log('SW: Network failed for:', url.pathname);
            
            // For navigation requests, serve index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html')
                .then((indexResponse) => {
                  if (indexResponse) {
                    console.log('SW: Serving cached index.html for navigation');
                    return indexResponse;
                  }
                  return new Response('App not cached - please visit once online', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                });
            }
            
            // For other requests, return a basic offline response
            return new Response('Resource not available offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('SW: Offline-first service worker loaded');