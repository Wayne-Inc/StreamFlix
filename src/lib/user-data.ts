import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  writeBatch,
} from "firebase/firestore";

export async function deleteUserData(userId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete profiles
  const profilesSnap = await getDocs(collection(db, "users", userId, "profiles"));
  profilesSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete continue watching
  const cwSnap = await getDocs(collection(db, "users", userId, "continueWatching"));
  cwSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete my list
  const mlSnap = await getDocs(collection(db, "users", userId, "myList"));
  mlSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete history
  const histSnap = await getDocs(collection(db, "users", userId, "history"));
  histSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete device tracking
  const devSnap = await getDocs(collection(db, "users", userId, "devices"));
  devSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete session tracking
  const sessSnap = await getDocs(collection(db, "users", userId, "sessions"));
  sessSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete recommendations
  const recSnap = await getDocs(collection(db, "users", userId, "recommendations"));
  recSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete release notifications
  const relSnap = await getDocs(collection(db, "users", userId, "releaseNotifications"));
  relSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete user document (favoriteGenres, etc.)
  batch.delete(doc(db, "users", userId));

  await batch.commit();
}