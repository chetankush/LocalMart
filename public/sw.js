/* LocalMart service worker — "new order" notifications for sellers.
   Shows the notification the server pushes (even with the browser closed on
   Android), and opens the orders page when it's tapped. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'LocalMart', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'New order on LocalMart';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || undefined,
      // Same order again (reminder) = ring again, don't stack
      renotify: !!data.tag,
      requireInteraction: !!data.requireInteraction,
      vibrate: [500, 250, 500, 250, 800],
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      data: { url: data.url || '/vendor/approvals' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/vendor/approvals';
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && 'focus' in w) {
          try {
            await w.navigate(url);
          } catch (e) {
            /* page may not allow navigation; focusing is enough */
          }
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
