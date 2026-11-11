// Learn Braille service worker: app shell cached for offline use, refreshed in the background.
const CACHE = 'learn-braille-v26';
const SHELL = ['./', './index.html', './css/style.css?v=26', './js/app.js?v=26', './js/braille.js?v=26', './js/data.js?v=26', './js/games.js?v=26', './js/gamedata.js?v=26', './js/wordlist.js?v=26', './js/phrases.js?v=26', './js/snowman.js?v=26', './js/agentcases.js?v=26',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !font) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: false });
    const net = fetch(e.request).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
