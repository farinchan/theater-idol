// Service Worker for Theater Idol PWA
const CACHE_NAME = 'theater-idol-v1'
const STATIC_PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.png',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-64x64.png'
]

// Install event: cache core static assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Pre-caching error:', err)
      })
    })
  )
})

// Activate event: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event: required for Chrome/Edge PWA installability criteria
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle HTTP/HTTPS GET requests, ignore Appwrite/API/proxy calls from strict caching
  if (
    event.request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('appwrite')
  ) {
    return
  }

  // Stale-while-revalidate for images & icons
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2)$/i) ||
    url.pathname.includes('/manifest.')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          }).catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Network first with cache fallback for pages
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/')
          if (fallback) return fallback
        }
        return new Response('Offline - Periksa koneksi internet Anda.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      })
  )
})
