import { auth } from "@/lib/firebase";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export async function requestNotificationPermission(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging);
      console.log("FCM token:", token);
    }
  } catch {
    // Firebase Messaging not configured
  }
}

export function onForegroundMessage(): () => void {
  try {
    if (typeof window === "undefined") return () => {};
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    const messaging = getMessaging();
    const token = await getToken(messaging);
    return token ?? null;
  } catch {
    return null;
  }
}
