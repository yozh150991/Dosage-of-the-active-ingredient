/* Кеш офлайн-оболонки. Версію змінюйте при кожному релізі — інакше
   у батьків залишиться стара логіка розрахунку. */
const CACHE = "doza-v1.1.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/archivo-latin-wght-normal.woff2",
  "./fonts/archivo-latin-ext-wght-normal.woff2",
  "./fonts/manrope-cyrillic-wght-normal.woff2",
  "./fonts/manrope-cyrillic-ext-wght-normal.woff2",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Мережа спочатку, кеш як запасний варіант: якщо інтернет є, батьки
   завжди отримують найсвіжішу версію формул. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
