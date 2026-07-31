import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type MyListItem = {
  id: string;
  tmdbId: string;
  title: string;
  year: number;
  poster: string;
  addedAt: Timestamp;
  order: number;
};

function docId(userId: string, tmdbId: string) {
  return `${userId}_${tmdbId}`;
}

export async function addToMyList(movie: {
  id: string;
  title: string;
  year: number;
  poster: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = doc(db, "my_list", docId(user.uid, movie.id));
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  const q = query(collection(db, "my_list"), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  const maxOrder = snap.docs.reduce((max, d) => {
    const data = d.data();
    return data.order != null && data.order > max ? data.order : max;
  }, 0);
  await setDoc(ref, {
    userId: user.uid,
    tmdbId: movie.id,
    title: movie.title,
    year: movie.year,
    poster: movie.poster,
    addedAt: serverTimestamp(),
    order: maxOrder + 1,
  });
}

export async function removeFromMyList(tmdbId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = doc(db, "my_list", docId(user.uid, tmdbId));
  await deleteDoc(ref);
}

export async function isInMyList(tmdbId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const ref = doc(db, "my_list", docId(user.uid, tmdbId));
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function getMyList(): Promise<MyListItem[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "my_list"), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as MyListItem)
    .sort((a, b) => {
      const oa = a.order ?? 0;
      const ob = b.order ?? 0;
      return oa - ob;
    });
}

export async function reorderMyList(tmdbId: string, newOrder: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = doc(db, "my_list", docId(user.uid, tmdbId));
  await updateDoc(ref, { order: newOrder });
}

export async function swapMyListOrder(tmdbId1: string, tmdbId2: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref1 = doc(db, "my_list", docId(user.uid, tmdbId1));
  const ref2 = doc(db, "my_list", docId(user.uid, tmdbId2));
  const [snap1, snap2] = await Promise.all([getDoc(ref1), getDoc(ref2)]);
  if (!snap1.exists() || !snap2.exists()) throw new Error("Item not found");
  const order1 = snap1.data().order ?? 0;
  const order2 = snap2.data().order ?? 0;
  await Promise.all([updateDoc(ref1, { order: order2 }), updateDoc(ref2, { order: order1 })]);
}
