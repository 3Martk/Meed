const CACHE_NAME = 'dr221-pwa-v23';
const STATIC_ASSETS = [
  './',
  './dashboard.html',
  './schedule.html',
  './courses.html',
  './materials.html',
  './qa.html',
  './seminars.html',
  './chat.html',
  './profile.html',
  './settings.html',
  './admin.html',
  './login.html',
  './app.css?v=20261125-23',
  './app.js?v=20261125-23',
  './manifest.json',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin || url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./login.html')))
  );
});
