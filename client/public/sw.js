const CACHE_VERSION = 'v9';
const STATIC_CACHE = `ventas-static-${CACHE_VERSION}`;
const API_CACHE = `ventas-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const API_CACHE_URLS = [
  '/api/me/bootstrap',
  '/api/productos',
  '/api/rutas',
  '/api/clientes',
  '/api/descuentos'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('SW: Some static assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('ventas-') && 
                   name !== STATIC_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('SW: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    if (shouldCacheApiRequest(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
    } else {
      event.respondWith(networkFirst(request));
    }
  } else {
    event.respondWith(cacheFirstWithOfflineFallback(request));
  }
});

function shouldCacheApiRequest(pathname) {
  return API_CACHE_URLS.some(url => pathname.startsWith(url));
}

async function cacheFirstWithOfflineFallback(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const url = new URL(request.url);
    if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    return new Response('Sin conexión', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('SW: Network request failed for', request.url);
    return null;
  });

  if (cachedResponse) {
    fetchPromise.catch(() => {});
    return cachedResponse;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response(JSON.stringify({ 
    error: 'Sin conexión', 
    offline: true,
    cached: false 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ 
      error: 'Sin conexión',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ventas') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_VENTAS' });
        });
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-ventas-periodic') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'PERIODIC_SYNC_VENTAS' });
        }
      })
    );
  }
});

async function registerBackgroundSync() {
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-ventas');
      console.log('Background sync registered');
    } catch (err) {
      console.log('Background sync registration failed:', err);
    }
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data === 'clearApiCache') {
    caches.delete(API_CACHE).then(() => {
      event.ports[0]?.postMessage({ cleared: true });
    });
  }

  if (event.data === 'registerSync') {
    registerBackgroundSync();
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva notificación',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: data.actions || [],
      tag: data.tag || 'default',
      renotify: true,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Garlo Alimentos', options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const hadClient = clients.find(c => c.url === urlToOpen && 'focus' in c);
      if (hadClient) {
        return hadClient.focus();
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
