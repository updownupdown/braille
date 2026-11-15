// Learn Braille service worker.
// Network first for the app's own files (so a deploy shows up on the next load, with no version numbers to bump),
// falling back to the cached copy offline. Fonts are cache first. Every file the app loads is cached as it goes;
// SHELL only warms the cache on install so the app also works offline before every page has been visited.
const CACHE = 'learn-braille';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './js/app.js', './js/braille.js', './js/data.js', './js/games.js', './js/gamedata.js', './js/wordlist.js', './js/phrases.js',
  './js/snowman.js', './js/agentcases.js', './js/g2examples.js', './js/trivia2.js', './js/langcontractions.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'no-cache' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  if (url.pathname.endsWith('/version.json')) return; // always straight from the network
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (font) {
      const hit = await c.match(e.request);
      return hit || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; });
    }
    try {
      // no-cache: revalidate with the server (cheap 304 when nothing changed) instead of trusting the HTTP cache.
      // (A navigation request can't be re-fetched with options, so fetch by URL.)
      const r = await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' });
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch {
      return (await c.match(e.request, { ignoreSearch: true })) || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
    }
  }));
});
