import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type UserLegalVersions = {
  tosVersion: string;
  privacyVersion: string;
  updatedAt?: Date;
};

/**
 * Get the user's accepted TOS and Privacy Policy versions from Firestore.
 * Returns the stored versions or null if not set.
 */
export async function getUserLegalVersions(userId: string): Promise<UserLegalVersions | null> {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.tosVersion && !data.privacyVersion) return null;
    return {
      tosVersion: data.tosVersion ?? "",
      privacyVersion: data.privacyVersion ?? "",
      updatedAt: data.legalVersionsUpdatedAt?.toDate?.(),
    };
  } catch {
    return null;
  }
}

/**
 * Set the user's accepted TOS version in Firestore.
 */
export async function setUserTosVersion(userId: string, version: string): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      tosVersion: version,
      legalVersionsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Set the user's accepted Privacy Policy version in Firestore.
 */
export async function setUserPrivacyVersion(userId: string, version: string): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      privacyVersion: version,
      legalVersionsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Set both TOS and Privacy Policy versions at once.
 */
export async function setUserLegalVersions(
  userId: string,
  versions: { tosVersion: string; privacyVersion: string }
): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      tosVersion: versions.tosVersion,
      privacyVersion: versions.privacyVersion,
      legalVersionsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Check if user's stored versions are outdated compared to current versions.
 * Returns an object indicating which (if any) are outdated.
 */
export function checkVersionsOutdated(
  stored: UserLegalVersions | null,
  currentTosVersion: string,
  currentPrivacyVersion: string
): { tosOutdated: boolean; privacyOutdated: boolean } {
  if (!stored) {
    return { tosOutdated: true, privacyOutdated: true };
  }
  return {
    tosOutdated: stored.tosVersion !== currentTosVersion,
    privacyOutdated: stored.privacyVersion !== currentPrivacyVersion,
  };
}