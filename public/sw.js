const CACHE_NAME = 'maahol-v2-0.1';
const TEMP_CACHE_NAME = 'maahol-temp-cache';
const ASSETS_CACHE_NAME = 'maahol-assets-cache';

// Cache version timestamp - this will change with each build
const CACHE_VERSION = new Date().toISOString();
const urlsToCache = [
  '/maahol/',
  '/maahol/index.html',
  '/maahol/manifest.json',
  '/maahol/images/Maahol.png',
  '/maahol/images/cassete.png',
  '/maahol/sounds/beach.ogg',
  '/maahol/sounds/birds.ogg',
  '/maahol/sounds/brown-noise.ogg',
  '/maahol/sounds/cafe.ogg',
  '/maahol/sounds/campfire.ogg',
  '/maahol/sounds/city.ogg',
  '/maahol/sounds/fireplace.ogg',
  '/maahol/sounds/forest.ogg',
  '/maahol/sounds/heavy-rain.ogg',
  '/maahol/sounds/night-crickets.ogg',
  '/maahol/sounds/pink-noise.ogg',
  '/maahol/sounds/rain-camping.ogg',
  '/maahol/sounds/rain-car.ogg',
  '/maahol/sounds/rain.ogg',
  '/maahol/sounds/snow.ogg',
  '/maahol/sounds/thunder.ogg',
  '/maahol/sounds/train.ogg',
  '/maahol/sounds/white-noise.ogg',
  '/maahol/sounds/wind.ogg',
  // Add MP3 versions for Safari support
  '/maahol/sounds/beach.mp3',
  '/maahol/sounds/birds.mp3',
  '/maahol/sounds/brown-noise.mp3',
  '/maahol/sounds/cafe.mp3',
  '/maahol/sounds/campfire.mp3',
  '/maahol/sounds/city.mp3',
  '/maahol/sounds/fireplace.mp3',
  '/maahol/sounds/forest.mp3',
  '/maahol/sounds/heavy-rain.mp3',
  '/maahol/sounds/night-crickets.mp3',
  '/maahol/sounds/pink-noise.mp3',
  '/maahol/sounds/rain-camping.mp3',
  '/maahol/sounds/rain-car.mp3',
  '/maahol/sounds/rain.mp3',
  '/maahol/sounds/snow.mp3',
  '/maahol/sounds/thunder.mp3',
  '/maahol/sounds/train.mp3',
  '/maahol/sounds/white-noise.mp3',
  '/maahol/sounds/wind.mp3'
];

self.addEventListener('install', (event) => {
  // Don't activate immediately - wait until the user accepts the update
  self.skipWaiting = false;
  
  event.waitUntil(
    // Use a temporary cache for the new version
    caches.open(TEMP_CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            });
          })
        );
      })
      .then(() => {
        // After caching is complete, notify the client that an update is available
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'updateAvailable'
            });
          });
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle requests to our domain
  if (url.origin !== 'https://codedude19.github.io') {
    return;
  }

  // Handle JS files and assets with a network-first strategy to get the latest versions
  if (url.pathname.endsWith('.js') || url.pathname.includes('assets/') || url.pathname.includes('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful responses
          if (response && response.status === 200) {
            // Clone the response to store in cache
            const responseToCache = response.clone();
            
            // Store in assets cache with version info
            caches.open(ASSETS_CACHE_NAME)
              .then(cache => {
                // Add a custom header to track when this asset was cached
                const headers = new Headers(responseToCache.headers);
                headers.append('x-cached-at', CACHE_VERSION);
                
                const responseWithTimestamp = new Response(responseToCache.body, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                });
                
                cache.put(event.request, responseWithTimestamp);
              });
          }
            
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other resources, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Special handling for audio file extensions
        if (url.pathname.endsWith('.ogg') && !navigator.userAgent.includes('Safari')) {
          return fetch(event.request);
        } else if (url.pathname.endsWith('.mp3') && navigator.userAgent.includes('Safari')) {
          return fetch(event.request);
        }
        
        // For all other assets, fetch and cache
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      // First, copy all content from temp cache to main cache
      if (cacheNames.includes(TEMP_CACHE_NAME)) {
        const tempCache = await caches.open(TEMP_CACHE_NAME);
        const mainCache = await caches.open(CACHE_NAME);
        const tempKeys = await tempCache.keys();
        
        // Copy all entries from temp cache to main cache
        for (const request of tempKeys) {
          const response = await tempCache.match(request);
          if (response) {
            await mainCache.put(request, response);
          }
        }
      }
      
      // Keep the assets cache, but delete all other old caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients so they use the new version immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old assets in the assets cache
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME).then(cache => {
      // Get all cached requests
      return cache.keys().then(async requests => {
        // Simple approach: if we have too many items, remove the oldest ones
        // This avoids complex sorting issues
        if (requests.length > 50) {
          console.log(`Cleaning up assets cache, ${requests.length} items found`);
          
          // Get all responses with their timestamps
          const entriesWithDates = [];
          
          for (const request of requests) {
            try {
              const response = await cache.match(request);
              if (response) {
                const cachedAt = response.headers.get('x-cached-at') || '';
                entriesWithDates.push({ request, cachedAt });
              }
            } catch (error) {
              console.error('Error accessing cached response:', error);
            }
          }
          
          // Sort by timestamp (oldest first)
          entriesWithDates.sort((a, b) => {
            return a.cachedAt.localeCompare(b.cachedAt);
          });
          
          // Delete oldest entries, keeping the 30 newest
          const entriesToDelete = entriesWithDates.slice(0, entriesWithDates.length - 30);
          
          console.log(`Removing ${entriesToDelete.length} old cached assets`);
          
          // Delete the old entries
          const deletionPromises = entriesToDelete.map(entry => cache.delete(entry.request));
          return Promise.all(deletionPromises);
        }
        
        return Promise.resolve();
      });
    })
  );
});

// Listen for the skipWaiting message from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
});