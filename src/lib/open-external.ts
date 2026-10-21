import { isInApp } from "@/lib/app-downloads";

export async function openExternal(url: string): Promise<void> {
  if (isInApp()) {
    // In a native app context (if we ever have one again), use window.location
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
