// Petal Calendar — Service Worker
// Place this file in the SAME folder as petal_calendar.html

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE') scheduleAll(e.data.reminders);
});

function scheduleAll(reminders) {
  reminders.forEach(r => {
    const delay = r.fireAt - Date.now();
    if (delay < 0 || delay > 7 * 24 * 60 * 60 * 1000) return;
    setTimeout(() => {
      self.registration.showNotification(r.title, {
        body: r.body,
        icon: r.icon,
        badge: r.icon,
        tag: r.id,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: self.location.href }
      });
    }, delay);
  });
}

self.addEventListener('activate', e => { self.clients.claim(); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
