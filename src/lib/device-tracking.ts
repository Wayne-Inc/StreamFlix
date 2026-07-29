import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";

const DEVICE_ID_KEY = "streamflix_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function parseUserAgent(ua: string): { browser: string; os: string; label: string } {
  const u = ua || "";
  let browser = "Browser";
  if (/Edg\//.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/.test(u)) browser = "Opera";
  else if (/Chrome\//.test(u) && !/Chromium/.test(u)) browser = "Chrome";
  else if (/Firefox\//.test(u)) browser = "Firefox";
  else if (/Safari\//.test(u) && /Version\//.test(u)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows NT 10/.test(u)) os = "Windows";
  else if (/Windows/.test(u)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(u)) os = "macOS";
  else if (/Android/.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(u)) os = "iOS";
  else if (/Linux/.test(u)) os = "Linux";

  let device = "Desktop";
  if (/iPad|Tablet/.test(u)) device = "Tablet";
  else if (/Mobile|iPhone|Android.*Mobile/.test(u)) device = "Mobile";

  const label = `${browser} on ${os} · ${device}`;
  return { browser, os, label };
}

export async function recordCurrentDevice(): Promise<void> {
  if (typeof window === "undefined") return;
  const user = auth.currentUser;
  if (!user) return;
  const ua = navigator.userAgent;
  const { browser, os, label } = parseUserAgent(ua);
  const device_id = getDeviceId();

  const deviceRef = doc(db, "user_devices", device_id);
  await setDoc(deviceRef, {
    user_id: user.uid,
    device_id,
    device_label: label,
    browser,
    os,
    user_agent: ua,
    last_seen_at: serverTimestamp(),
    created_at: serverTimestamp(),
  }, { merge: true });
}
