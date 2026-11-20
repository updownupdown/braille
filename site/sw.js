// Learn Braille service worker.
// Network first for the app's own files (so a deploy shows up on the next load, with no version numbers to bump),
// falling back to the cached copy offline. Fonts are cache first. Every file the app loads is cached as it goes;
// SHELL only warms the cache on install so the app also works offline before every page has been visited.
const CACHE = 'learn-braille';
const NET_WAIT = 3000; // ms to wait for the network before falling back to the cache
let slowUntil = 0; // after a slow fetch, serve cached files at once until this time
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './fonts/outfit-latin.woff2', './fonts/outfit-latin-ext.woff2',
  './js/app.js', './js/core.js', './js/home.js', './js/practice.js', './js/learn.js', './js/translate.js', './js/braille.js', './js/data.js', './js/games.js', './js/gamedata.js', './js/wordlist.js', './js/phrases.js',
  './js/snowman.js', './js/agentcases.js', './js/g2examples.js', './js/trivia2.js', './js/langcontractions.js', './js/sixkey.js', './js/storage.js', './js/passages.js', './js/a11y.js', './js/rules.js', './js/compose.js', './js/placement.js', './js/milestones.js', './js/clock.js'];

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
  if (url.origin !== location.origin) return;
  const font = url.pathname.endsWith('.woff2'); // fonts never change: cache first
  if (url.pathname.endsWith('/version.json')) return; // always straight from the network
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (font) {
      const hit = await c.match(e.request);
      return hit || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; });
    }
    const cached = () => c.match(e.request, { ignoreSearch: true }).then((hit) => hit || (e.request.mode === 'navigate' ? c.match('./index.html') : undefined));
    // no-cache: revalidate with the server (cheap 304 when nothing changed) instead of trusting the HTTP cache.
    // (A navigation request can't be re-fetched with options, so fetch by URL.)
    const net = fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    e.waitUntil(net.catch(() => {}));
    // On a weak signal, don't wait for the network forever: after NET_WAIT use the cached copy (the fetch still
    // finishes in the background and refreshes the cache for next time).
    // Once one file has had to fall back, the rest of that page load doesn't wait again: for the next few
    // seconds cached files are served at once (each still refreshed in the background).
    const wait = Date.now() < slowUntil ? 0 : NET_WAIT;
    const slow = new Promise((res) => setTimeout(res, wait)).then(cached).then((hit) => { if (hit && wait) slowUntil = Date.now() + 15000; return hit || net; });
    try { return await Promise.race([net, slow]); }
    catch { return (await cached()) || Response.error(); }
  }));
});
