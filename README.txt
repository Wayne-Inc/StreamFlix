StreamFlix — Build Notes
========================

WEB APP
-------
Dev:              npm run dev            (Vite dev server, port 8080)
Prod build:       npm run build          (TanStack Start SSR -> .vercel/output for Vercel)
Lint:             npm run lint
Typecheck:        npx tsc --noEmit -p tsconfig.json

DESKTOP (Electron)
------------------
Dev:              npm run electron:dev
Prod:             npm run electron:build   (outputs installers to release/)

- In development the Electron shell loads http://localhost:8080.
- In production it loads https://streamflix.dpdns.org/.
- Override the URL anytime:  ELECTRON_START_URL=https://streamflix.dpdns.org/ npx electron .

MOBILE (Capacitor / Android)
----------------------------
The mobile app is a Capacitor WebView wrapper around the deployed site, the same
way the Electron desktop build works. It loads https://streamflix.dpdns.org/.

What was added:
- capacitor.config.ts        appId com.itiswayneee.streamflix, server URL, Chrome-like
                             user agent (so Google's OAuth accepts the WebView), status bar
- android/                   generated Android project (App ID com.itiswayneee.streamflix)
- src/lib/mobile.ts          detects the Capacitor runtime, handles the Android hardware
                             back button, status bar colors, and streamflix:// deep links
- src/routes/auth.tsx        Google sign-in uses signInWithRedirect inside the WebView
- streamflix:// scheme       registered in AndroidManifest.xml for deep links

Requirements (one-time):
- Android Studio (or Android SDK + JDK 21+). Open android/ in Android Studio; it will
  download Gradle and dependencies on first build. See https://capacitorjs.com/docs/android

Rebuild / sync:
- After changing capacitor.config.ts or installing plugins:  npm run mobile:sync
- Run the app:    npm run mobile:open        (opens android/ in Android Studio)
- Build APK:      npm run mobile:build       (or Build > Build APK in Android Studio)

IMPORTANT:
- The mobile shell loads the LIVE deployed site. Web changes in src/ only take effect in
  the app after you rebuild and redeploy the web app to https://streamflix.dpdns.org/.
- Email/password sign-in works fully in the app. Google sign-in uses the in-WebView
  redirect flow; if Google ever blocks it, wire up @capacitor-firebase/authentication
  (native Google Sign-In) for a fully native OAuth experience.
- A Play Store build that only wraps a remote URL may be rejected; for store release,
  consider bundling a local static build or using the native auth plugins.
