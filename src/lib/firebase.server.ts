let _app: Awaited<ReturnType<typeof import("firebase-admin/app")["initializeApp"]>> | null = null;

async function getApp() {
  if (_app) return _app;
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  if (getApps().length > 0) {
    _app = getApps()[0];
  } else {
    _app = initializeApp({
      credential: cert({
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return _app;
}

export async function getAdminAuth() {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getApp());
}

let _adminDb: Awaited<ReturnType<typeof import("firebase-admin/firestore")["getFirestore"]>> | null = null;

export async function getAdminDb() {
  if (!_adminDb) {
    const { getFirestore } = await import("firebase-admin/firestore");
    _adminDb = getFirestore(await getApp());
  }
  return _adminDb;
}
