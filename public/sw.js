/**
 * Service worker — aligné sur le guide PWA Next.js (push + notifications).
 * Pas de handler fetch : pas de cache offline par défaut.
 * @see https://nextjs.org/docs/app/guides/progressive-web-apps
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }

  const title = data.title ?? "Notification";
  const options = {
    body: data.body ?? "",
    ...(data.icon ? { icon: data.icon } : {}),
    ...(data.badge ? { badge: data.badge } : {}),
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey ?? "1",
      openUrl: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const openUrl =
    event.notification.data?.openUrl ?? self.registration.scope;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUnclaimed: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(openUrl);
        }
      }),
  );
});
