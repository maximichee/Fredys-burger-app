// Service worker de Fredy's Burger: solo da una página propia cuando no hay conexión.
// No guarda el menú ni los precios (siempre se piden en vivo), así nunca se muestran datos viejos.
const CACHE = 'fredys-v1';
const SIN_CONEXION = '/offline.html';
const PRECARGA = [SIN_CONEXION, '/iconos/icono-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(SIN_CONEXION)));
    return;
  }
  // El ícono de la página sin conexión sale de lo guardado; todo lo demás va directo a la red
  const { pathname } = new URL(e.request.url);
  if (PRECARGA.includes(pathname)) e.respondWith(fetch(e.request).catch(() => caches.match(pathname)));
});
