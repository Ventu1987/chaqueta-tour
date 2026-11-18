/* Chaqueta Tour · copia offline de la app
   - La app (index.html) se pide siempre a internet primero, así llegan los cambios; sin señal, se usa la copia.
   - Fotos, logos e íconos se guardan la primera vez que se ven.
   - Las librerías (Supabase, gráficos, fuentes) se guardan para poder abrir la app sin señal.
   - Supabase y la planilla de Google nunca se guardan acá: esos datos se manejan dentro de la app.
   Si cambia la lista de archivos de abajo, subir el número de VERSION. */
const VERSION = "ct-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "snapshot.json",
  "img/logo-tour.webp", "img/logo-bag.webp", "img/logo-resto.webp",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const LIBRERIAS = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const guardar = (req, res) => { if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return res; };

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const propio = url.origin === location.origin;

  /* la app y los datos de respaldo: internet primero, la copia si no hay señal */
  if (propio && (req.mode === "navigate" || /\/(index\.html|snapshot\.json|manifest\.webmanifest)?$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(r => guardar(req, r))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  /* imágenes propias y librerías: la copia primero, internet si todavía no está */
  if ((propio && /\.(webp|png|jpg|svg)$/.test(url.pathname)) || LIBRERIAS.test(req.url)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(x => guardar(req, x))));
  }
  /* todo lo demás (Supabase, la planilla, script.google.com) pasa directo */
});
