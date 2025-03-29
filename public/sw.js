const CACHE_NAME = 'maahol-v3.300';
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
  '/maahol/sounds/wind.ogg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            });
          })
        );
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
        
        // For assets, we'll let the network handle it since they have hashed names
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});