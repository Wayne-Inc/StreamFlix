// Polyfill __dirname for ES modules (fixes Firebase Admin SDK / google-gax on Vercel)
import { fileURLToPath } from "url";
import { dirname } from "path";
globalThis.__dirname = dirname(fileURLToPath(import.meta.url));

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

function initAdmin(): void {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[Firebase Admin] Missing credentials - server auth disabled");
    return;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    console.log("[Firebase Admin] Initialized successfully");
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
  }
}

initAdmin();

export function getAdminAuth(): Auth | undefined {
  return adminAuth;
}

export function getAdminDb(): Firestore | undefined {
  return adminDb;
}

export function isAdminInitialized(): boolean {
  return !!adminAuth;
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string; email: string; claims: Record<string, unknown> } | null> {
  if (!adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email ?? "", claims: decoded };
  } catch (error) {
    console.warn("[Firebase Admin] Token verification failed:", error);
    return null;
  }
}

export async function createSessionCookie(idToken: string, expiresIn = 60 * 60 * 24 * 14 * 1000): Promise<string> {
  if (!adminAuth) throw new Error("Firebase Admin not initialized");
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

export async function verifySessionCookie(sessionCookie: string): Promise<{ uid: string; email: string; claims: Record<string, unknown> } | null> {
  if (!adminAuth) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? "", claims: decoded };
  } catch (error) {
    console.warn("[Firebase Admin] Session cookie verification failed:", error);
    return null;
  }
}

export async function revokeRefreshTokens(uid: string): Promise<void> {
  if (!adminAuth) return;
  await adminAuth.revokeRefreshTokens(uid);
}

export { adminApp, adminAuth, adminDb };