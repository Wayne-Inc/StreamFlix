import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.itiswayneee.streamflix",
  appName: "StreamFlix",
  webDir: "dist",
  server: {
    // StreamFlix is a server-rendered app, so the native shell loads the live
    // site (same as the Electron production build). The Android WebView shares
    // cookies/storage with the origin so auth and preferences persist.
    url: "https://streamflix.dpdns.org/",
    cleartext: false,
    // Present a normal mobile-Chrome UA so Google's OAuth page does not flag
    // the embedded WebView as an insecure browser ("This browser or app may
    // not be secure") — mirrors the Electron UA stripping in electron/main.cjs.
    overrideUserAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#09090b",
    captureInput: false,
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#09090b",
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
    },
    FirebaseAuthentication: {
      providers: ["github.com"],
    },
  },
};

export default config;
