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