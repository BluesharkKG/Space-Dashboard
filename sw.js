const CACHE_NAME = 'astralis-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/global.css',
  '/css/landing.css',
  '/css/page.css',
  '/js/config.js',
  '/js/apod.js',
  '/js/space-weather.js',
  '/js/asteroids.js',
  '/js/earth-events.js',
  '/js/media.js',
  '/js/earth-imagery.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
