const CACHE_VERSION = 'v10';
const STATIC_CACHE = `ventas-static-${CACHE_VERSION}`;
const API_CACHE = `ventas-api-${CACHE_VERSION}`;
const ASSETS_CACHE = `ventas-assets-${CACHE_VERSION}`;

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
                   name !== API_CACHE &&
                   name !== ASSETS_CACHE;
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
  } else if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirstForAssets(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(cacheFirstWithOfflineFallback(request));
  }
});

function shouldCacheApiRequest(pathname) {
  return API_CACHE_URLS.some(url => pathname.startsWith(url));
}

async function cacheFirstForAssets(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('SW: Failed to fetch asset:', request.url);
    return new Response('Asset not available offline', { 
      status: 503, 
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function handleNavigation(request) {
  const cachedIndex = await caches.match('/index.html');
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put('/index.html', response.clone());
      return response;
    }
    if (cachedIndex) {
      return cachedIndex;
    }
    return response;
  } catch (error) {
    if (cachedIndex) {
      console.log('SW: Serving cached index.html for navigation');
      return cachedIndex;
    }
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('Sin conexión', { 
      status: 503, 
      headers: { 'Content-Type': 'text/html' }
    });
  }
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

  return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
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
    return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
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
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_VENTAS_PERIODIC' });
        });
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Ventas por Ruta';
    const options = {
      body: data.body || 'Nueva notificación',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('SW: Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_BOOTSTRAP_CACHE') {
    caches.open(API_CACHE).then(cache => {
      cache.delete('/api/me/bootstrap');
      console.log('SW: Bootstrap cache cleared');
    });
  }
});
