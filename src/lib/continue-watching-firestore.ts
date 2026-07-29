import { doc, setDoc, getDocs, collection, query, where, deleteDoc, limit as fLimit } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Movie } from "./types";

const CW_COLLECTION = "continue_watching";
const MAX = 12;

export type FirestoreContinueItem = {
  id: string;
  userId: string;
  profileId: string;
  movieId: string;
  title: string;
  poster: string;
  backdrop: string;
  rating: string;
  runtime: string;
  genres: string[];
  match: number;
  description: string;
  year: number;
  cast: string[];
  castPfp: string[];
  director: string;
  progress: number;
  duration: number;
  updatedAt: number;
  season?: number;
  episode?: number;
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

function makeDocId(movieId: string, season?: number, episode?: number) {
  return season != null && episode != null ? `${movieId}:S${season}E${episode}` : movieId;
}

export async function saveProgressToFirestore(movie: Movie, progress: number, duration: number, season?: number, episode?: number) {
  const user = auth.currentUser;
  if (!user) return;
  const profileId = getSelectedProfileId();
  if (!profileId) return;
  if (!duration || !isFinite(duration)) return;
  const ratio = progress / duration;
  const docId = `${user.uid}_${profileId}_${makeDocId(movie.id, season, episode)}`;
  if (ratio >= 0.95) {
    await deleteDoc(doc(db, CW_COLLECTION, docId)).catch(() => {});
    return;
  }
  if (progress <= 5) return;
  const data: FirestoreContinueItem = {
    id: docId,
    userId: user.uid,
    profileId,
    movieId: movie.id,
    title: movie.title,
    poster: movie.poster,
    backdrop: movie.backdrop,
    rating: movie.rating,
    runtime: movie.runtime,
    genres: movie.genres,
    match: movie.match,
    description: movie.description,
    year: movie.year,
    cast: movie.cast,
    castPfp: movie.castPfp,
    director: movie.director,
    progress,
    duration,
    updatedAt: Date.now(),
    season,
    episode,
  };
  await setDoc(doc(db, CW_COLLECTION, docId), data);
}

export async function getContinueWatchingFromFirestore(): Promise<FirestoreContinueItem[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const profileId = getSelectedProfileId();
  if (!profileId) return [];
  const q = query(
    collection(db, CW_COLLECTION),
    where("userId", "==", user.uid),
    where("profileId", "==", profileId),
    fLimit(MAX),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as FirestoreContinueItem))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function toMovie(item: FirestoreContinueItem): Movie {
  return {
    id: item.movieId,
    title: item.title,
    description: item.description,
    year: item.year,
    rating: item.rating,
    runtime: item.runtime,
    genres: item.genres,
    poster: item.poster,
    backdrop: item.backdrop,
    cast: item.cast,
    castPfp: item.castPfp,
    director: item.director,
    match: item.match,
  };
}
