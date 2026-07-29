import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export type Subtitle = {
  lang: string;
  label: string;
  url: string;
};

export type VideoSource = {
  id: string;
  tmdb_id: string;
  title: string;
  video_url: string;
  type: "movie" | "tv";
  subtitles?: Subtitle[];
};

export async function getVideoSource(tmdbId: string): Promise<VideoSource | null> {
  try {
    const snap = await getDoc(doc(db, "movie_sources", tmdbId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as VideoSource;
  } catch {
    return null;
  }
}

export async function listVideoSources(): Promise<VideoSource[]> {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "movie_sources"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VideoSource));
  } catch {
    return [];
  }
}