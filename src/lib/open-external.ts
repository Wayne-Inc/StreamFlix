import { isInApp } from "@/lib/app-downloads";

export async function openExternal(url: string): Promise<void> {
  if (isInApp()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, toolbarColor: "#09090b", presentationStyle: "popover" });
    } catch {
      window.location.href = url;
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
