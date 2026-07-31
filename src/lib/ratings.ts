import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function docId(userId: string, movieId: string) {
  return `${userId}_${movieId}`;
}

export async function rateMovie(userId: string, movieId: string, rating: number): Promise<void> {
  const ref = doc(db, "ratings", docId(userId, movieId));
  await setDoc(ref, {
    userId,
    movieId,
    rating,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserRating(movieId: string): Promise<number | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, "ratings", docId(user.uid, movieId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().rating as number;
}

export async function getMovieRatings(
  movieId: string,
): Promise<{ average: number; count: number }> {
  const q = query(collection(db, "ratings"), where("movieId", "==", movieId));
  const snap = await getDocs(q);
  const ratings = snap.docs.map((d) => d.data().rating as number);
  const count = ratings.length;
  const average = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
  return { average, count };
}
