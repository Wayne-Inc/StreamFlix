import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  limit as fLimit,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import type { WatchHistoryItem } from "./continue-watching";

const HISTORY_COLLECTION = "watch_history";
const MAX = 50;

type FirestoreHistoryItem = WatchHistoryItem & {
  movieId: string;
  userId: string;
  profileId: string;
};

function getSelectedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("sf:selectedProfile");
    if (!raw) return null;
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

function makeDocId(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

export async function saveHistoryToFirestore(item: WatchHistoryItem) {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  const docId = `${user.uid}_${profileId}_${makeDocId(item.id)}`;
  const data: FirestoreHistoryItem = {
    ...item,
    movieId: item.id.split(":")[0],
    userId: user.uid,
    profileId,
  };
  await setDoc(doc(db, HISTORY_COLLECTION, docId), data);
}

export async function removeHistoryFromFirestore(itemId: string) {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("userId", "==", user.uid),
    where("profileId", "==", profileId),
  );
  const snap = await getDocs(q);
  const targets = snap.docs.filter((d) => {
    const data = d.data() as FirestoreHistoryItem;
    return data.movieId === itemId || data.id === itemId;
  });
  await Promise.all(targets.map((d) => deleteDoc(d.ref).catch(() => {})));
}

export async function clearHistoryFromFirestore() {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("userId", "==", user.uid),
    where("profileId", "==", profileId),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
}

export async function getWatchHistoryFromFirestore(): Promise<WatchHistoryItem[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const profileId = getSelectedProfileId();
  if (!profileId) return [];
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("userId", "==", user.uid),
    where("profileId", "==", profileId),
    fLimit(MAX),
  );
  const snap = await getDocs(q);
  return (snap.docs.map((d) => d.data()) as WatchHistoryItem[]).sort(
    (a, b) => b.watchedAt - a.watchedAt,
  );
}
