type ShareInput = {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
};

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function shareContent(input: ShareInput): Promise<"shared" | "copied"> {
  const shareUrl = input.url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = input.title || "StreamFlix";
  const shareText = input.text || shareTitle;

  // Web Share API (works in Chrome, not all WebViews)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };

      // Only attach image files on mobile — desktop shares as image instead of link
      if (input.image && isMobile() && typeof navigator.canShare === "function") {
        try {
          const response = await fetch(input.image);
          const blob = await response.blob();
          if (blob.size > 0) {
            const file = new File([blob], "poster.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          }
        } catch {}
      }

      await navigator.share(shareData);
      return "shared";
    } catch (err: any) {
      if (err?.name !== "AbortError") {
      }
    }
  }

  // Capacitor native share
  try {
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return "shared";
    }
  } catch {}

  // Clipboard fallback
  if (shareUrl && typeof navigator.clipboard?.writeText === "function") {
    await navigator.clipboard.writeText(shareUrl);
  }
  return "copied";
}
