// Firebase Messaging is an optional runtime dependency in some targets, and
// its package declaration is not exposed by the installed Firebase typings.
// @ts-expect-error Firebase Messaging may be unavailable in non-web builds.
import { getMessaging, getToken, onMessage, isSupported, type Messaging, type MessagePayload } from "firebase/messaging";
// Firestore is an optional runtime dependency in some targets, and its package
// declaration is not exposed by the installed Firebase typings.
// @ts-expect-error Firebase Firestore may be unavailable in non-web builds.
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getDeviceId } from "./device-tracking";

function showPushNotification(
  title: string,
  options: { description?: string; duration?: number; action?: { label: string; onClick: () => void } } = {},
): void {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const notification = new Notification(title, { body: options.description });
    notification.onclick = options.action?.onClick ?? (() => notification.close());
    if (options.duration) setTimeout(() => notification.close(), options.duration);
    return;
  }
  console.info(title, options.description ?? "");
}

const pushError = (message: string): void => showPushNotification("StreamFlix", { description: message });

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
  const vapidKey = (import.meta as ImportMeta & {
    env?: { VITE_FIREBASE_VAPID_KEY?: string };
  }).env?.VITE_FIREBASE_VAPID_KEY;
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
    // Capacitor is an optional target dependency and may not be installed for web builds.
    // @ts-expect-error The Capacitor plugin is unavailable in non-Capacitor builds.
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

      PushNotifications.addListener("registration", async (token: { value: string }) => {
        clearTimeout(timeout);
        await saveTokenToFirestore(token.value, "android");
        console.log("Capacitor push: Subscription granted");
        resolve("granted");
      });

      PushNotifications.addListener("registrationError", (err: unknown) => {
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

// Validate VAPID key - pass it through as-is since Firebase SDK should handle the format
function validateVapidKey(vapidKey: string): string | null {
  if (!vapidKey) {
    console.warn("Web push: VAPID key is empty");
    return null;
  }

  // Trim whitespace
  const trimmed = vapidKey.trim();
  if (!trimmed) {
    console.warn("Web push: VAPID key is only whitespace");
    return null;
  }

  console.log("Web push: VAPID key received:", JSON.stringify(trimmed));

  // Basic validation - check it looks like base64url (the format from Firebase console)
  // URL-safe base64 alphabet: A-Z, a-z, 0-9, -, _, plus optional padding =
  const base64urlRegex = /^[A-Za-z0-9\-_]+=*$/;
  if (!base64urlRegex.test(trimmed)) {
    console.error("Web push: VAPID key contains invalid characters for base64url:", trimmed);
    return null;
  }

  // Check approximate length - VAPID keys are usually around 88 characters
  if (trimmed.length < 50 || trimmed.length > 200) {
    console.warn("Web push: VAPID key length seems unusual:", trimmed.length);
  }

  return trimmed; // Return as-is - Firebase SDK should handle base64url format
}

async function ensureWebPush(): Promise<PushStatus> {
  console.log("ensureWebPush called");
  const user = auth.currentUser;
  console.log("Web push: user =", user ? "present" : "null");
  if (!user) {
    console.warn("Web push: No authenticated user");
    return "unavailable";
  }
  const messaging = await getMessagingInstance();
  console.log("Web push: messaging =", messaging ? "present" : "null");
  if (!messaging) {
    console.warn("Web push: Firebase messaging not available");
    return "unavailable";
  }
  const vapidKey = (import.meta as ImportMeta & {
    env: Record<string, string | undefined>;
  }).env.VITE_FIREBASE_VAPID_KEY;
  console.log("Web push: vapidKey from env =", vapidKey ? "present" : "null");
  if (!vapidKey) {
    console.warn("Web push: VAPID key not configured");
    return "no-vapid";
  }

  // Validate VAPID key (pass through as-is)
  const validatedVapidKey = validateVapidKey(vapidKey);
  if (!validatedVapidKey) {
    console.error("Web push: Failed to validate VAPID key");
    return "unavailable";
  }

  try {
    if (typeof Notification === "undefined") {
      console.warn("Web push: Notification API not available");
      return "unavailable";
    }
    let permission = Notification.permission;
    console.log("Web push: Notification.permission =", permission);
    if (permission === "default") {
      permission = await Notification.requestPermission();
      console.log("Web push: After requestPermission, permission =", permission);
    }
    if (permission !== "granted") {
      console.warn("Web push: Notification permission denied");
      return "denied";
    }

    console.log("Web push: About to call getToken with VAPID key (as-is from env)");
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-messaging-sw.js", updateViaCache: "none" },
    );
    const token = await getToken(messaging, {
      vapidKey: validatedVapidKey,
      serviceWorkerRegistration,
    });
    console.log("Web push: getToken returned:", token ? "token present" : "null/empty");
    if (!token) {
      console.warn("Web push: FCM token not available");
      return "unavailable";
    }
    await saveTokenToFirestore(token, "web");
    console.log("Web push: Subscription granted");
    return "granted";
  } catch (error: any) {
    console.error("Web push: Failed to subscribe:", error);
    console.error("Error details:", error);
    // Check if it's the specific VAPID key error
    if (error.message?.includes('applicationServerKey is not valid')) {
      console.error("Web push: VAPID key validation failed - the key from environment may be incorrect for this Firebase project");
      console.error("Web push: Please verify that VITE_FIREBASE_VAPID_KEY in your .env matches the key from Firebase Console > Project Settings > Cloud Messaging tab");
      console.error("Web push: The key should be a base64url-encoded string (no + or / characters, may end with =)");
      console.error("Web push: You can get the correct key from: Firebase Console → Project Settings → Cloud Messaging tab → Web Push certificates");
    }
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
      const vapidKey = (import.meta as ImportMeta & {
        env?: { VITE_FIREBASE_VAPID_KEY?: string };
      }).env?.VITE_FIREBASE_VAPID_KEY;
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
    // The Capacitor plugin is optional in web/Electron builds.
    // @ts-expect-error The plugin may not be installed for non-Capacitor targets.
    import("@capacitor/push-notifications")
      .then(({ PushNotifications }) => {
        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification: { title?: string; body?: string }) => {
            showPushNotification(notification.title ?? "StreamFlix", {
              description: notification.body ?? "",
              duration: 6000,
            });
          },
        );
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action: { notification: { data?: Record<string, string> } }) => {
          const data = action.notification.data;
          if (data?.movie_id) {
            window.location.href = `/movie/${data.movie_id}`;
          }
          },
        );
      })
      .catch((err) => {
        console.error("Failed to setup Capacitor push notifications:", err);
        pushError("Failed to setup push notifications");
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
      onMessage(messaging, (payload: MessagePayload) => {
        const data = payload.data ?? {};
        const title = payload.notification?.title ?? data.title ?? "StreamFlix";
        const body = payload.notification?.body ?? data.body ?? "";
        const movieId = data.movie_id;
        showPushNotification(title, {
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
      pushError("Failed to setup push notifications");
    });
}