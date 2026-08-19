type ShareInput = {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
};

export async function shareContent(input: ShareInput): Promise<"shared" | "copied"> {
  const shareUrl = input.url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = input.text || input.title || "";
  const shareTitle = input.title || "StreamFlix";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };

      if (input.image && typeof navigator.canShare === "function") {
        try {
          const response = await fetch(input.image);
          const blob = await response.blob();
          const file = new File([blob], "poster.jpg", { type: "image/jpeg" });
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
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
  if (shareUrl && typeof navigator.clipboard?.writeText === "function") {
    await navigator.clipboard.writeText(shareUrl);
  }
  return "copied";
}
