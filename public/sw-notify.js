// Imported into the generated Workbox service worker.
// Tapping an alarm notification focuses the app (which routes straight to the active trial) or opens it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/app/ring'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => 'focus' in w)
      return existing ? existing.focus() : self.clients.openWindow(url)
    }),
  )
})
