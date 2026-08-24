import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.itiswayneee.streamflix",
  appName: "StreamFlix",
  webDir: "dist",
  server: {
    // The SSR app is served from the deployed site in the native shell.
    url: "https://streamflix.dpdns.org/",
    cleartext: false,
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
      backgroundColor: "#000000",
      style: "DARK",
    },
    FirebaseAuthentication: {
      providers: ["github.com", "google.com"],
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert", "banner", "list"],
    },
  },
};

export default config;
