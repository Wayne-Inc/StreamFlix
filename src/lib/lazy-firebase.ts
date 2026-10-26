// Lazy Firebase initialization - only loads Firebase when actually needed
// This prevents the 741KB vendor-firebase bundle from loading on initial page load

let firebaseInitPromise: Promise<{
  auth: any;
  db: any;
  app: any;
  signOut: any;
  onAuthStateChanged: any;
  doc: any;
  getDoc: any;
  onSnapshot: any;
  setDoc: any;
  serverTimestamp: any;
  initializeAppCheck: any;
  ReCaptchaV3Provider: any;
}> | null = null;

let firebaseInitialized = false;

export async function getFirebase() {
  if (firebaseInitialized) {
    return firebaseInitPromise!;
  }

  firebaseInitialized = true;
  firebaseInitPromise = (async () => {
    // Dynamically import Firebase modules only when needed
    const [
      { initializeApp, getApps },
      { getAuth, signOut, onAuthStateChanged },
      { getFirestore, doc, getDoc, onSnapshot, setDoc, serverTimestamp },
      { initializeAppCheck, ReCaptchaV3Provider },
    ] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
      import("firebase/app-check"),
    ]);

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

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);

    // Initialize App Check for Firestore and Auth protection (client-side only)
    if (typeof window !== "undefined" && import.meta.env.VITE_APP_CHECK_SITE_KEY) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(import.meta.env.VITE_APP_CHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("[App Check] Initialized with reCAPTCHA v3");
      } catch (e) {
        console.warn("[App Check] Failed to initialize:", e);
      }
    }

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
        return getFirestore(app);
      }
    }

    const db = createDb();

    // Local Emulator Suite
    if (import.meta.env.VITE_FIREBASE_EMULATOR === "1") {
      const { connectAuthEmulator, connectFirestoreEmulator } = await import("firebase/auth");
      const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1";
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, emulatorHost, 8080);
    }

    const { initializeFirestore } = await import("firebase/firestore");

    return {
      auth,
      db,
      app,
      signOut,
      onAuthStateChanged,
      doc,
      getDoc,
      onSnapshot,
      setDoc,
      serverTimestamp,
      initializeAppCheck,
      ReCaptchaV3Provider,
    };
  })();

  return firebaseInitPromise;
}

// Helper to check if user is authenticated without loading full Firebase
export function getAuthCache(): boolean {
  try {
    return localStorage.getItem("sf:auth") === "1";
  } catch {
    return false;
  }
}

// For server-side auth checking without loading client Firebase
export function isLikelyAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getAuthCache();
}