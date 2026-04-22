// Minimal service worker — gives the PWA "installable" badge.
// No fetch interception (avoid stale-asset surprises with Next.js standalone).
// Network-first navigation fallback so opening offline shows last-cached `/`.

const CACHE = 'tlz-shell-v1'
const SHELL = ['/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (request.mode !== 'navigate') return
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match('/').then((r) => r || Response.error()))
  )
})
