// Petal Calendar — Service Worker v3
// Stores reminders and checks every minute — survives lock screen on Android

const CACHE = 'petal-v3';
let reminders = [];
let pollTimer = null;

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SCHEDULE') {
    reminders = e.data.reminders || [];
    caches.open(CACHE).then(c => {
      c.put('reminders', new Response(JSON.stringify(reminders)));
    });
    startPolling();
    console.log('[SW] Scheduled', reminders.length, 'reminders');
  }
  if (e.data.type === 'TEST') {
    self.registration.showNotification('Petal Calendar Test', {
      body: 'Notifications are working! Your reminders will fire on time.',
      vibrate: [300, 100, 300],
      requireInteraction: false,
    });
  }
});

self.addEventListener('activate', e => {
  e.waitUntil(
    self.clients.claim().then(() =>
      caches.open(CACHE).then(c =>
        c.match('reminders').then(r => {
          if (r) return r.json().then(data => {
            reminders = data || [];
            console.log('[SW] Restored', reminders.length, 'reminders');
            if (reminders.length) startPolling();
          });
        })
      )
    )
  );
});

self.addEventListener('install', () => self.skipWaiting());

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  checkAndFire();
  pollTimer = setInterval(checkAndFire, 60000);
}

function checkAndFire() {
  const now = Date.now();
  const tolerance = 65000;
  reminders.forEach(r => {
    const diff = now - r.fireAt;
    if (diff >= 0 && diff < tolerance) {
      self.registration.showNotification(r.title, {
        body: r.body,
        tag: r.tag || r.id,
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        silent: false,
        data: { url: self.location.origin + '/petal-calendar/' }
      }).catch(err => console.warn('[SW] Notification failed:', err));
    }
  });
  reminders = reminders.filter(r => r.fireAt > now - tolerance);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.location.origin + '/petal-calendar/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('petal-calendar') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
