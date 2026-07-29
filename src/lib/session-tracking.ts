import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  where,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDeviceId } from "@/lib/device-tracking";

function getSelectedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sf:selectedProfile");
    if (!raw) return null;
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

export async function startSession(movieId: string): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const profileId = getSelectedProfileId();
  if (!profileId) return null;
  const deviceId = getDeviceId();
  const docRef = await addDoc(collection(db, "sessions"), {
    userId: user.uid,
    profileId,
    movieId,
    deviceId,
    startedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function endSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, "sessions", sessionId));
}

export async function getActiveSessionCount(userId: string): Promise<number> {
  const q = query(collection(db, "sessions"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function cleanupSessions(): Promise<void> {
  const cutoff = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, "sessions"),
    where("lastActiveAt", "<=", cutoff),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
