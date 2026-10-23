import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

export type Profile = {
  id: string;
  userId: string;
  name: string;
  color: string;
  kids: boolean;
  avatarUrl?: string;
  pin?: string;
  hasPin?: boolean;
  // Parental controls
  contentRatingLimit?: "G" | "PG" | "PG-13" | "R" | "NC-17" | "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA";
  pinHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CONTENT_RATINGS = [
  { value: "G", label: "G - General Audiences", order: 1 },
  { value: "PG", label: "PG - Parental Guidance", order: 2 },
  { value: "PG-13", label: "PG-13 - Parents Strongly Cautioned", order: 3 },
  { value: "R", label: "R - Restricted", order: 4 },
  { value: "NC-17", label: "NC-17 - Adults Only", order: 5 },
  { value: "TV-Y", label: "TV-Y - All Children", order: 1 },
  { value: "TV-Y7", label: "TV-Y7 - Older Children", order: 2 },
  { value: "TV-G", label: "TV-G - General Audience", order: 2 },
  { value: "TV-PG", label: "TV-PG - Parental Guidance", order: 3 },
  { value: "TV-14", label: "TV-14 - Parents Strongly Cautioned", order: 4 },
  { value: "TV-MA", label: "TV-MA - Mature Audience", order: 5 },
] as const;

export type ContentRating = typeof CONTENT_RATINGS[number]["value"];

export function getRatingOrder(rating: string): number {
  const found = CONTENT_RATINGS.find((r) => r.value === rating);
  return found?.order ?? 99;
}

export function isRatingAllowed(profileRating: ContentRating | undefined, contentRating: string): boolean {
  if (!profileRating) return true; // No limit = allow all
  const profileOrder = getRatingOrder(profileRating);
  const contentOrder = getRatingOrder(contentRating);
  return contentOrder <= profileOrder;
}

const profileColors = [
  "from-rose-500 to-red-700",
  "from-sky-500 to-indigo-700",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-violet-500 to-purple-700",
  "from-pink-500 to-rose-700",
  "from-cyan-500 to-blue-700",
  "from-lime-400 to-green-600",
];

export async function getUserProfiles(userId: string): Promise<Profile[]> {
  const q = query(collection(db, "users", userId, "profiles"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      hasPin: !!data.pinHash,
      contentRatingLimit: data.contentRatingLimit,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Profile;
  });
}

function removeUndefinedFields<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export async function createProfile(
  userId: string,
  data: Omit<Profile, "id" | "userId" | "color" | "createdAt" | "updatedAt" | "hasPin" | "pinHash">,
): Promise<Profile> {
  const profiles = await getUserProfiles(userId);
  const color = profileColors[profiles.length % profileColors.length];
  const payload = {
    ...removeUndefinedFields(data),
    userId,
    color,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "users", userId, "profiles"), payload);

  return {
    id: docRef.id,
    userId,
    ...data,
    color,
    hasPin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateProfile(
  userId: string,
  profileId: string,
  data: Partial<Omit<Profile, "id" | "userId" | "createdAt">>,
): Promise<void> {
  const payload = {
    ...removeUndefinedFields(data),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, "users", userId, "profiles", profileId), payload);
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "profiles", profileId));
}

export async function ensureUserHasProfile(
  userId: string,
  displayName: string,
): Promise<Profile[]> {
  const profiles = await getUserProfiles(userId);
  if (profiles.length === 0) {
    await createProfile(userId, {
      name: displayName || "Profile 1",
      kids: false,
    });
    return getUserProfiles(userId);
  }
  return profiles;
}

export async function setProfilePin(userId: string, profileId: string, pin: string): Promise<void> {
  const pinHash = btoa(pin);
  await updateDoc(doc(db, "users", userId, "profiles", profileId), {
    pinHash,
    updatedAt: serverTimestamp(),
  });
}

export async function removeProfilePin(userId: string, profileId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId, "profiles", profileId), {
    pinHash: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function verifyProfilePin(
  userId: string,
  profileId: string,
  pin: string,
): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", userId, "profiles", profileId));
  if (!snap.exists()) return false;
  const data = snap.data();
  if (!data.pinHash) return true;
  return data.pinHash === btoa(pin);
}

export async function profileHasPin(userId: string, profileId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", userId, "profiles", profileId));
  if (!snap.exists()) return false;
  return !!snap.data().pinHash;
}

export async function isKidsProfile(userId: string, profileId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", userId, "profiles", profileId));
  if (!snap.exists()) return false;
  return !!snap.data().kids;
}
