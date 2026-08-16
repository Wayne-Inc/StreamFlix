importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD9vC8lVvHiscbheGuazhrlM3r46sBWwyI",
  authDomain: "streamflix-e91bc.firebaseapp.com",
  projectId: "streamflix-e91bc",
  storageBucket: "streamflix-e91bc.firebasestorage.app",
  messagingSenderId: "1064779147344",
  appId: "1:1064779147344:web:c582202e1b9b7311128955",
});

const messaging = firebase.messaging();

function absUrl(path) {
  return new URL(path, self.registration.scope).href;
}

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = (payload.notification && payload.notification.title) || data.title || "StreamFlix";
  const body =
    (payload.notification && payload.notification.body) || data.body || "Something new to watch.";
  const icon = (payload.notification && payload.notification.icon) || absUrl("/icon.png");

  self.registration.showNotification(title, {
    body,
    icon,
    badge: absUrl("/icon.png"),
    tag: data.movie_id ? `release-${data.movie_id}` : "streamflix",
    data: { url: data.url || "/", movie_id: data.movie_id || "" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;
  const url = target && target.startsWith("/") ? absUrl(target) : target || absUrl("/");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === new URL(url).origin) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
