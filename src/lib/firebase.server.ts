import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC4dcLiwMn3HH3GDAjntLgbNqFfN6g5c3A",
  authDomain: "streamflix-e91bc.firebaseapp.com",
  projectId: "streamflix-e91bc",
  storageBucket: "streamflix-e91bc.firebasestorage.app",
  messagingSenderId: "1064779147344",
  appId: "1:1064779147344:web:c582202e1b9b7311128955",
}

let app: ReturnType<typeof initializeApp>

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: firebaseConfig.projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
} else {
  app = getApps()[0]
}

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
