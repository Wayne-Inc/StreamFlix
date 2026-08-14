import { doc, setDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Movie } from "./types";

const MYLIST_COLLECTION = "my_list";

type FirestoreMyListEntry = {
  id: string;
  addedAt: number;
  movie: Movie;
  userId: string;
  profileId: string;
  movieId: string;
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

function makeDocId(movieId: string) {
  return movieId.replace(/[^a-zA-Z0-9]/g, "_");
}

export async function setMyListInFirestore(movie: Movie, inList: boolean) {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  const docId = `${user.uid}_${profileId}_${makeDocId(movie.id)}`;
  if (!inList) {
    await deleteDoc(doc(db, MYLIST_COLLECTION, docId)).catch(() => {});
    return;
  }
  const data: FirestoreMyListEntry = {
    id: movie.id,
    movieId: movie.id,
    userId: user.uid,
    profileId,
    addedAt: Date.now(),
    movie,
  };
  await setDoc(doc(db, MYLIST_COLLECTION, docId), data);
}

export async function removeMyListFromFirestore(id: string) {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  const docId = `${user.uid}_${profileId}_${makeDocId(id)}`;
  await deleteDoc(doc(db, MYLIST_COLLECTION, docId)).catch(() => {});
}

export async function getMyListFromFirestore(): Promise<
  { id: string; addedAt: number; movie: Movie }[]
> {
  const user = auth.currentUser;
  if (!user) return [];
  const profileId = getSelectedProfileId();
  if (!profileId) return [];
  const q = query(
    collection(db, MYLIST_COLLECTION),
    where("userId", "==", user.uid),
    where("profileId", "==", profileId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as FirestoreMyListEntry)
    .filter((e) => e.movie)
    .sort((a, b) => b.addedAt - a.addedAt);
}
