// Nombre de la caché (cámbialo si actualizas la app para forzar la recarga)
const CACHE_NAME = 'simulacro-evasion-v1';

// Archivos críticos que se descargarán al instalar la app
const RECURSOS_OFFLINE = [
  './',
  './index.html',
  './manifest.json',
  './img_curso.png', // <--- Añadido para funcionamiento offline
  // Es vital cachear la librería externa de la base de datos para que funcione sin internet
  'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js'
];

// FASE 1: INSTALACIÓN
// Se ejecuta la primera vez que el usuario abre la web.
self.addEventListener('install', (evento) => {
  console.log('[Service Worker] Instalando y guardando caché...');
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RECURSOS_OFFLINE);
    })
  );
  // Fuerza al Service Worker a activarse inmediatamente
  self.skipWaiting();
});

// FASE 2: ACTIVACIÓN
// Se ejecuta cuando el Service Worker toma el control. Limpia cachés antiguas si cambiaste la versión.
self.addEventListener('activate', (evento) => {
  console.log('[Service Worker] Activado');
  evento.waitUntil(
    caches.keys().then((nombresDeCache) => {
      return Promise.all(
        nombresDeCache.map((nombre) => {
          if (nombre !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', nombre);
            return caches.delete(nombre);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FASE 3: INTERCEPTACIÓN DE PETICIONES (EL MODO OFFLINE)
// Cada vez que la app pide un archivo (HTML, imagen, script), pasa por aquí.
self.addEventListener('fetch', (evento) => {
  evento.respondWith(
    caches.match(evento.request).then((respuestaCacheada) => {
      // 1. Si el archivo está en la caché, devuélvelo INMEDIATAMENTE (Modo Offline)
      if (respuestaCacheada) {
        return respuestaCacheada;
      }
      
      // 2. Si no está en la caché, intenta buscarlo en internet
      return fetch(evento.request).catch(() => {
        // 3. Si falla internet y es una petición de navegación, puedes devolver una página de error
        console.warn('[Service Worker] Petición fallida y no hay red:', evento.request.url);
      });
    })
  );
});