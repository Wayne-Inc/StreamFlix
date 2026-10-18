import { initializeApp, getApps, cert } from "firebase-admin/app";

type AdminApp = ReturnType<typeof initializeApp>;
let app: AdminApp | undefined;

function getAdminApp(): AdminApp {
  if (app) return app;
  const existingApp = getApps()[0];
  if (existingApp) {
    app = existingApp;
    return app;
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const missing = [
    !projectId && "VITE_FIREBASE_PROJECT_ID",
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !privateKey && "FIREBASE_PRIVATE_KEY",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Firebase Admin configuration is missing: ${missing.join(", ")}.`);
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

let _adminDb: Awaited<ReturnType<typeof import("firebase-admin/firestore")["getFirestore"]>> | null = null;

export async function getAdminDb() {
  if (!_adminDb) {
    const { getFirestore } = await import("firebase-admin/firestore");
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}
