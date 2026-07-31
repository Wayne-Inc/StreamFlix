import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4dcLiwMn3HH3GDAjntLgbNqFfN6g5c3A",
  authDomain: "streamflix-e91bc.firebaseapp.com",
  projectId: "streamflix-e91bc",
  storageBucket: "streamflix-e91bc.firebasestorage.app",
  messagingSenderId: "1064779147344",
  appId: "1:1064779147344:web:c582202e1b9b7311128955",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
