/* Korea 2027 — service worker
   - App shell and trip data: cached on install, so the itinerary works offline.
   - Map outline, fonts, photos: cached the first time they load.
   - Weather and exchange-rate APIs: always network. The app falls back to its
     own saved copy and labels it "not live", so nothing pretends to be live. */
const VERSION = 'k27-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/data.js', 'assets/js/core.js', 'assets/js/map.js', 'assets/js/itinerary.js',
  'assets/js/info.js', 'assets/js/budget.js', 'assets/js/kit.js', 'assets/js/journal.js', 'assets/js/boot.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png'
];
const RUNTIME = VERSION + '-rt', PHOTOS = VERSION + '-img';
const API = /open-meteo\.com|er-api\.com|frankfurter\.app/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

async function trim(name, max) {
  const c = await caches.open(name), keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (API.test(url.hostname)) return; // live data: network only, handled by the app

  // pages: network first, fall back to the cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // same-origin assets: stale-while-revalidate
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) caches.open(VERSION).then(c => c.put(req, r.clone())); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // photos: cache first, keep the most recent 40
  if (url.hostname === 'images.unsplash.com') {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); trim(PHOTOS, 40); } return r; }))));
    return;
  }
  // map outline + fonts: cache first
  if (/cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
  }
});
