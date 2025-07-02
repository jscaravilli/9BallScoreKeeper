const CACHE_NAME = 'nineball-scorekeeper-v1.0.6';
const STATIC_CACHE = 'static-v1.0.6';
const DYNAMIC_CACHE = 'dynamic-v1.0.6';

// Cache all static assets for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-mobile.png',
  '/.well-known/assetlinks.json'
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE)
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch strategy: Cache first for static assets, network first for dynamic content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle static assets (cache first)
  if (STATIC_ASSETS.includes(url.pathname) || 
      request.destination === 'image' ||
      request.destination === 'script' ||
      request.destination === 'style') {
    
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => {
          // Return offline fallback for failed requests
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Handle API requests (network first, cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(error => {
        // Handle 431 Request Header Fields Too Large
        if (error.message && error.message.includes('431')) {
          console.warn('SW: 431 error detected, clearing cookies to reduce header size');
          // Post message to main thread to clear large cookies
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'CLEAR_LARGE_COOKIES' });
            });
          });
        }
        
        return caches.match(request).then(response => {
          if (response) {
            return response;
          }
          // Return error response for failed API calls when offline
          return new Response(
            JSON.stringify({ error: 'Offline - using local storage' }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
    );
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => {
        return caches.match('/');
      });
    })
  );
});

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Sync any pending offline data when connection is restored
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_DATA' });
  });
}

// Handle push notifications (if needed later)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New game update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('9 Ball Scorekeeper', options)
  );
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});