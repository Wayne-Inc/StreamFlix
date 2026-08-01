import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
} from "firebase/firestore";

export type ReleaseNotification = {
  id: string;
  user_id: string;
  movie_id: string;
  title: string;
  poster: string;
  release_date: string;
  created_at?: unknown;
  reminded_at?: unknown;
};

export type NotifiableItem = {
  id: string;
  title: string;
  poster: string;
  releaseDate: string;
};

export async function toggleReleaseNotification(
  userId: string,
  item: NotifiableItem,
): Promise<boolean> {
  const ref = doc(db, "release_notifications", `${userId}_${item.id}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    user_id: userId,
    movie_id: item.id,
    title: item.title,
    poster: item.poster,
    release_date: item.releaseDate,
    created_at: serverTimestamp(),
  });
  return true;
}

export async function getUserNotifications(userId: string): Promise<ReleaseNotification[]> {
  const q = query(collection(db, "release_notifications"), where("user_id", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ReleaseNotification[];
}

export async function getNotifiedIds(userId: string): Promise<Set<string>> {
  const list = await getUserNotifications(userId);
  return new Set(list.map((n) => n.movie_id));
}

export async function markReminded(userId: string, movieId: string): Promise<void> {
  const ref = doc(db, "release_notifications", `${userId}_${movieId}`);
  await updateDoc(ref, { reminded_at: serverTimestamp() }).catch(() => {});
}
