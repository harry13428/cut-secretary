// 「不要再忘記了」的背景程式：收到推播就跳通知，點通知打開 App
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: '不要再忘記了', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '不要再忘記了', {
    body: d.body || '', tag: d.tag || undefined, icon: 'icon-alarm-180.png', badge: 'icon-alarm-180.png',
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.indexOf('/cut-secretary/') >= 0);
    return open ? open.focus() : self.clients.openWindow('./');
  }));
});
