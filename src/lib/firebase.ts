import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, type AppCheck } from "firebase/app-check";

// Try to import persistent cache (available in newer Firebase versions)
let persistentLocalCache: any;
let persistentMultipleTabManager: any;
try {
  const firestore = await import("firebase/firestore");
  persistentLocalCache = firestore.persistentLocalCache;
  persistentMultipleTabManager = firestore.persistentMultipleTabManager;
} catch {
  // Not available in this version
}

// Vite inlines VITE_* vars into both the client and server bundles.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize App Check for Firestore and Auth protection (client-side only)
// Only enable if reCAPTCHA Enterprise is properly configured AND not disabled via env
if (typeof window !== "undefined") {
  // Allow disabling App Check via env var while fixing reCAPTCHA Enterprise config
  const appCheckDisabled = import.meta.env.VITE_DISABLE_APP_CHECK === "true";

  if (import.meta.env.VITE_APP_CHECK_SITE_KEY && !appCheckDisabled) {
    try {
      const appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });

      // Test token retrieval
      getToken(appCheckInstance).catch(() => {
        // Ignore token errors - auth will work but without App Check protection
      });
    } catch {
      // Ignore initialization errors
    }
  }
}

// Persistent local cache so watch history, my list and profiles keep working
// offline and on flaky connections. Falls back to the in-memory cache when
// IndexedDB is unavailable (private mode, server-side rendering).
function createDb() {
  if (typeof window === "undefined") return getFirestore(app);
  try {
    if (persistentLocalCache && persistentMultipleTabManager) {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }
    return initializeFirestore(app, {});
  } catch {
    // Firestore was already initialized for this app (e.g. during HMR).
    return getFirestore(app);
  }
}

export const db = createDb();

// Local Emulator Suite. Opt in with VITE_FIREBASE_EMULATOR=1 in .env.local
// and run `firebase emulators:start` (see firebase.json).
if (import.meta.env.VITE_FIREBASE_EMULATOR === "1") {
  const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1";
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
}

export { app };
