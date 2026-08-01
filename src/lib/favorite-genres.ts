import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const GENRE_OPTIONS = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export async function getFavoriteGenres(userId: string): Promise<number[]> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return [];
  const genres = snap.data().favoriteGenres;
  return Array.isArray(genres) ? (genres as number[]) : [];
}

export async function setFavoriteGenres(userId: string, genreIds: number[]): Promise<void> {
  await setDoc(doc(db, "users", userId), { favoriteGenres: genreIds }, { merge: true });
}
