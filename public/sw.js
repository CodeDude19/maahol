const CACHE_NAME = 'maahol-v3.301';
const TEMP_CACHE_NAME = 'maahol-temp-cache';
const urlsToCache = [
  '/maahol/',
  '/maahol/index.html',
  '/maahol/manifest.json',
  '/maahol/images/Maahol.png',
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
        
        // For all other assets
        return fetch(event.request);
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
      
      // Then delete all old caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients so they use the new version immediately
  event.waitUntil(self.clients.claim());
});

// Listen for the skipWaiting message from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
});