import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: ReturnType<typeof initializeApp>;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);

let _adminDb: Awaited<ReturnType<typeof import("firebase-admin/firestore")["getFirestore"]>> | null = null;

export async function getAdminDb() {
  if (!_adminDb) {
    const { getFirestore } = await import("firebase-admin/firestore");
    _adminDb = getFirestore(app);
  }
  return _adminDb;
}
