import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, loadEnv, type UserConfig, type Plugin } from "vite";
import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

function firebaseMessagingSW(env: Record<string, string>): Plugin {
  function generate() {
    const get = (key: string) => env[key] || process.env[key] || "";
    const config = {
      apiKey: get("VITE_FIREBASE_API_KEY"),
      authDomain: get("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: get("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: get("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: get("VITE_FIREBASE_MESSAGING_SENDER_ID"),
      appId: get("VITE_FIREBASE_APP_ID"),
    };
    const sw = `importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config, null, 2)});

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
    tag: data.movie_id ? \`release-\${data.movie_id}\` : "streamflix",
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
`;
    writeFileSync(join(process.cwd(), "public", "firebase-messaging-sw.js"), sw);
  }

  return {
    name: "firebase-messaging-sw",
    buildStart() {
      generate();
    },
    configureServer() {
      generate();
    },
  };
}

export default defineConfig(({ command, mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
      ignoreOutdatedRequests: true,
    },
    plugins: [
      // Stub out Capacitor-only native modules on web builds so they don't
      // cause "failed to resolve module specifier" errors in the browser.
      {
        name: "stub-capacitor-native",
        resolveId(source) {
          if (
            source === "@capacitor-firebase/authentication" ||
            source === "@capacitor/push-notifications"
          ) {
            return { id: `\0capacitor-shim:${source}`, moduleSideEffects: false };
          }
        },
        load(id) {
          if (id.startsWith("\0capacitor-shim:")) {
            return "export default {}";
          }
        },
      },
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        server: { entry: "server" },
      }),
      ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
      react(),
      firebaseMessagingSW(env),
    ],
    build: {
      rollupOptions: {
        external: ["@capacitor/push-notifications", "@capacitor-firebase/authentication"],
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/firebase/") || id.includes("node_modules/@firebase/")) {
              return "vendor-firebase";
            }
            if (id.includes("node_modules/recharts")) {
              return "vendor-recharts";
            }
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
          },
        },
      },
    },
    server: {
      host: "::",
      port: 8080,
      watch: {
        awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
      },
    },
  };
});
