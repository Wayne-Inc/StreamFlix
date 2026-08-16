import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { auth, db } from "./firebase";
import { getDeviceId } from "./device-tracking";

let messagingPromise: Promise<Messaging | null> | null = null;

function getMessagingInstance(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (typeof window === "undefined") return null;
      try {
        if (!(await isSupported())) return null;
        return getMessaging();
      } catch {
        return null;
      }
    })();
  }
  return messagingPromise;
}

export type PushStatus = "granted" | "denied" | "unavailable" | "no-vapid";

export async function ensurePushSubscription(): Promise<PushStatus> {
  const user = auth.currentUser;
  if (!user) return "unavailable";
  const messaging = await getMessagingInstance();
  if (!messaging) return "unavailable";
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return "no-vapid";
  try {
    if (typeof Notification === "undefined") return "unavailable";
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return "denied";
    const token = await getToken(messaging, { vapidKey });
    if (!token) return "unavailable";
    await setDoc(
      doc(db, "fcm_tokens", token),
      {
        user_id: user.uid,
        token,
        device_id: getDeviceId(),
        platform: "web",
        user_agent: navigator.userAgent.slice(0, 500),
        created_at: serverTimestamp(),
        last_seen_at: serverTimestamp(),
      },
      { merge: true },
    );
    return "granted";
  } catch {
    return "unavailable";
  }
}

let foregroundStarted = false;

export function setupForegroundPush(): void {
  if (foregroundStarted) return;
  foregroundStarted = true;
  getMessagingInstance()
    .then((messaging) => {
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        const data = payload.data ?? {};
        const title = payload.notification?.title ?? data.title ?? "StreamFlix";
        const body = payload.notification?.body ?? data.body ?? "";
        const movieId = data.movie_id;
        toast(title, {
          description: body,
          duration: 6000,
          action: movieId
            ? {
                label: "Watch",
                onClick: () => {
                  window.location.href = `/movie/${movieId}`;
                },
              }
            : undefined,
        });
      });
    })
    .catch(() => {});
}
