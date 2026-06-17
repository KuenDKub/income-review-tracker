/* Web Push service worker for the Income Review Tracker PWA.
 * Kept dependency-free and tiny so it stays alive in the background on iOS,
 * where storage/CPU budgets for service workers are strict. */

// Take control of open pages as soon as a new SW activates.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Show a notification when a push arrives. Payload is the JSON sent by the
// server (see src/lib/push/webpush.ts). Falls back to sane defaults so a
// malformed/empty push still surfaces something.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text ? event.data.text() : "" };
  }

  const title = data.title || "Income Tracker";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab on the target URL, or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.pathname === targetUrl || client.url === targetUrl) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
