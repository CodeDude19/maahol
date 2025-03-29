const CACHE_NAME = 'maahol-v3.100';
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
  '/maahol/src/index.css',
  '/maahol/src/App.css',
  '/maahol/src/main.tsx',
  '/maahol/src/App.tsx'
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