const CACHE_NAME = 'bayti-dashboard-v2';

const ASSETS_TO_CACHE = [
  '/dashboard.html',
  '/dashboard-manifest.json',
  '/html2pdf.bundle.min.js',
  '/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') {
    event.respondWith(caches.match('/dashboard.html'));
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.url.includes('dashboard')) {
          return caches.match('/dashboard.html');
        }
        return new Response('غير متصل بالإنترنت', { status: 503 });
      });
    })
  );
});