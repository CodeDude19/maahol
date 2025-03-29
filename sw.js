const CACHE_NAME = 'maahol-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/Maahol.png',
  '/sounds/beach.ogg',
  '/sounds/birds.ogg',
  '/sounds/brown-noise.ogg',
  '/sounds/cafe.ogg',
  '/sounds/campfire.ogg',
  '/sounds/city.ogg',
  '/sounds/fireplace.ogg',
  '/sounds/forest.ogg',
  '/sounds/heavy-rain.ogg',
  '/sounds/night-crickets.ogg',
  '/sounds/pink-noise.ogg',
  '/sounds/rain-camping.ogg',
  '/sounds/rain-car.ogg',
  '/sounds/rain.ogg',
  '/sounds/snow.ogg',
  '/sounds/thunder.ogg',
  '/sounds/train.ogg',
  '/sounds/white-noise.ogg',
  '/sounds/wind.ogg',
  '/src/index.css',
  '/src/App.css',
  '/src/main.tsx',
  '/src/App.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
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