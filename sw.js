/* HeroBloom pultas — minimalus service worker.
   Reikalingas, kad naršyklė leistų įsidiegti kaip programėlę.
   Strategija: tinklas pirmiausia (kad statistika visada būtų šviežia),
   o be interneto parodo paskutinį išsaugotą puslapį. */
const CACHE = 'herobloom-pultas-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE).catch(function(){}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Tik savo puslapio failai keliauja pro cache; Supabase ir kt. — tiesiai į tinklą.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (resp) {
      const copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function(){}); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
