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

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return typeof w.Capacitor?.isNativePlatform === "function" && w.Capacitor.isNativePlatform();
}

function isElectron(): boolean {
  return typeof window !== "undefined" && "electronAPI" in window;
}

// ---------------------------------------------------------------------------
// checkPushSupport — returns the specific reason push won't work
// ---------------------------------------------------------------------------

export async function checkPushSupport(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "Server-side rendering" };

  // Capacitor: uses native FCM, always supported if google-services.json is present
  if (isCapacitor()) return { ok: true };

  // Electron: uses native Notification API — supported in packaged builds
  if (isElectron()) {
    if (typeof Notification !== "undefined") return { ok: true };
    return { ok: false, reason: "Desktop notifications not available in this build" };
  }

  // Web browser
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "Service Workers not supported" };
  if (location.protocol !== "https:" && location.hostname !== "localhost") return { ok: false, reason: "Requires HTTPS" };
  if (typeof Notification === "undefined") return { ok: false, reason: "Notification API not available" };
  try {
    const supported = await isSupported();
    if (!supported) return { ok: false, reason: "Firebase Messaging not supported in this browser" };
  } catch (e) {
    return { ok: false, reason: `Messaging check failed: ${e}` };
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return { ok: false, reason: "VAPID key not configured" };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Platform-specific push subscription
// ---------------------------------------------------------------------------

export type PushStatus = "granted" | "denied" | "unavailable" | "no-vapid";

async function saveTokenToFirestore(token: string, platform: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(
    doc(db, "fcm_tokens", token),
    {
      user_id: user.uid,
      token,
      device_id: getDeviceId(),
      platform,
      user_agent: navigator.userAgent.slice(0, 500),
      created_at: serverTimestamp(),
      last_seen_at: serverTimestamp(),
    },
    { merge: true },
  );
}

async function ensureCapacitorPush(): Promise<PushStatus> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Capacitor push: No authenticated user");
    return "unavailable";
  }
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request permission
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      console.warn("Capacitor push: Notification permission denied");
      return "denied";
    }

    // Register for FCM
    await PushNotifications.register();

    // Wait for token (the listener fires asynchronously)
    return await new Promise<PushStatus>((resolve) => {
      const timeout = setTimeout(() => resolve("unavailable"), 10000);

      PushNotifications.addListener("registration", async (token) => {
        clearTimeout(timeout);
        await saveTokenToFirestore(token.value, "android");
        console.log("Capacitor push: Subscription granted");
        resolve("granted");
      });

      PushNotifications.addListener("registrationError", (err) => {
        clearTimeout(timeout);
        console.error("Capacitor push registration error:", err);
        resolve("unavailable");
      });
    });
  } catch (e) {
    console.error("Capacitor push: Failed to subscribe:", e);
    return "unavailable";
  }
}

async function ensureWebPush(): Promise<PushStatus> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Web push: No authenticated user");
    return "unavailable";
  }
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn("Web push: Firebase messaging not available");
    return "unavailable";
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("Web push: VAPID key not configured");
    return "no-vapid";
  }
  try {
    if (typeof Notification === "undefined") {
      console.warn("Web push: Notification API not available");
      return "unavailable";
    }
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      console.warn("Web push: Notification permission denied");
      return "denied";
    }
    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      console.warn("Web push: FCM token not available");
      return "unavailable";
    }
    await saveTokenToFirestore(token, "web");
    console.log("Web push: Subscription granted");
    return "granted";
  } catch (error) {
    console.error("Web push: Failed to subscribe:", error);
    return "unavailable";
  }
}

async function ensureElectronPush(): Promise<PushStatus> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Electron push: No authenticated user");
    return "unavailable";
  }
  try {
    // Electron's renderer has the Notification API in packaged builds
    if (typeof Notification === "undefined") {
      console.warn("Electron push: Notification API not available");
      return "unavailable";
    }
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      console.warn("Electron push: Notification permission denied");
      return "denied";
    }

    // Try web FCM first (works if service worker is available)
    const messaging = await getMessagingInstance();
    if (messaging) {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (vapidKey) {
        const token = await getToken(messaging, { vapidKey });
        if (token) {
          await saveTokenToFirestore(token, "electron");
          console.log("Electron push: Subscription granted via FCM");
          return "granted";
        }
      }
    }

    // Fallback: save a synthetic token based on device ID so server can track this device
    const syntheticToken = `electron-${getDeviceId()}`;
    await saveTokenToFirestore(syntheticToken, "electron");
    console.log("Electron push: Subscription granted via synthetic token");
    return "granted";
  } catch (error) {
    console.error("Electron push: Failed to subscribe:", error);
    return "unavailable";
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function ensurePushSubscription(): Promise<PushStatus> {
  if (isCapacitor()) return ensureCapacitorPush();
  if (isElectron()) return ensureElectronPush();
  return ensureWebPush();
}

// ---------------------------------------------------------------------------
// Foreground push handler (web + Electron)
// ---------------------------------------------------------------------------

let foregroundStarted = false;

export function setupForegroundPush(): void {
  if (foregroundStarted) return;
  foregroundStarted = true;

  // Capacitor handles foreground notifications via native listeners
  if (isCapacitor()) {
    import("@capacitor/push-notifications")
      .then(({ PushNotifications }) => {
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          toast(notification.title ?? "StreamFlix", {
            description: notification.body ?? "",
            duration: 6000,
          });
        });
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data;
          if (data?.movie_id) {
            window.location.href = `/movie/${data.movie_id}`;
          }
        });
      })
      .catch((err) => {
        console.error("Failed to setup Capacitor push notifications:", err);
        toast.error("Failed to setup push notifications");
      });
    return;
  }

  // Web / Electron: use Firebase Messaging onMessage
  getMessagingInstance()
    .then((messaging) => {
      if (!messaging) {
        console.warn("Firebase messaging not available");
        return;
      }
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
    .catch((err) => {
      console.error("Failed to setup Firebase messaging foreground handler:", err);
      toast.error("Failed to setup push notifications");
    });
}
