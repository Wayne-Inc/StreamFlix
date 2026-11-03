import { db } from "./firebase";
import { collection, doc, getDocs, deleteDoc, query, where } from "firebase/firestore";

async function deleteMatching(collectionName: string, field: string, userId: string) {
  try {
    const snap = await getDocs(query(collection(db, collectionName), where(field, "==", userId)));
    await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch {
    // Collection may not allow reads/deletes; skip it.
  }
}

async function deleteSubcollection(path: string) {
  try {
    const snap = await getDocs(collection(db, path));
    await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch {
    // Subcollection may not exist or may be protected; skip it.
  }
}

async function deleteDocument(path: string) {
  try {
    await deleteDoc(doc(db, path));
  } catch {
    // Document may not exist or may be protected; skip it.
  }
}

/**
 * Best-effort deletion of all data associated with a user across the
 * top-level and legacy sub-collections used by the app.
 */
export async function deleteUserData(userId: string): Promise<void> {
  await Promise.allSettled([
    // Top-level collections keyed by user id.
    deleteMatching("continue_watching", "userId", userId),
    deleteMatching("watch_history", "userId", userId),
    deleteMatching("my_list", "userId", userId),
    deleteMatching("user_devices", "user_id", userId),
    deleteMatching("sessions", "userId", userId),
    deleteMatching("release_notifications", "user_id", userId),
    deleteMatching("fcm_tokens", "user_id", userId),

    // Legacy per-user sub-collections.
    deleteSubcollection(`users/${userId}/profiles`),
    deleteSubcollection(`users/${userId}/continueWatching`),
    deleteSubcollection(`users/${userId}/myList`),
    deleteSubcollection(`users/${userId}/history`),
    deleteSubcollection(`users/${userId}/devices`),
    deleteSubcollection(`users/${userId}/sessions`),
    deleteSubcollection(`users/${userId}/recommendations`),
    deleteSubcollection(`users/${userId}/releaseNotifications`),

    // Root documents.
    deleteDocument(`users/${userId}`),
    deleteDocument(`profiles/${userId}`),
  ]);
}
