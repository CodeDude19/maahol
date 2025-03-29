const CACHE_NAME = 'maahol-v2';
const urlsToCache = [
  '/serene-symphony-soundscapes/',
  '/serene-symphony-soundscapes/index.html',
  '/serene-symphony-soundscapes/manifest.json',
  '/serene-symphony-soundscapes/images/Maahol.png',
  '/serene-symphony-soundscapes/sounds/beach.ogg',
  '/serene-symphony-soundscapes/sounds/birds.ogg',
  '/serene-symphony-soundscapes/sounds/brown-noise.ogg',
  '/serene-symphony-soundscapes/sounds/cafe.ogg',
  '/serene-symphony-soundscapes/sounds/campfire.ogg',
  '/serene-symphony-soundscapes/sounds/city.ogg',
  '/serene-symphony-soundscapes/sounds/fireplace.ogg',
  '/serene-symphony-soundscapes/sounds/forest.ogg',
  '/serene-symphony-soundscapes/sounds/heavy-rain.ogg',
  '/serene-symphony-soundscapes/sounds/night-crickets.ogg',
  '/serene-symphony-soundscapes/sounds/pink-noise.ogg',
  '/serene-symphony-soundscapes/sounds/rain-camping.ogg',
  '/serene-symphony-soundscapes/sounds/rain-car.ogg',
  '/serene-symphony-soundscapes/sounds/rain.ogg',
  '/serene-symphony-soundscapes/sounds/snow.ogg',
  '/serene-symphony-soundscapes/sounds/thunder.ogg',
  '/serene-symphony-soundscapes/sounds/train.ogg',
  '/serene-symphony-soundscapes/sounds/white-noise.ogg',
  '/serene-symphony-soundscapes/sounds/wind.ogg',
  '/serene-symphony-soundscapes/src/index.css',
  '/serene-symphony-soundscapes/src/App.css',
  '/serene-symphony-soundscapes/src/main.tsx',
  '/serene-symphony-soundscapes/src/App.tsx'
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