type ShareInput = {
  title?: string;
  text?: string;
  url?: string;
};

export async function shareContent(input: ShareInput): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: input.title, text: input.text, url: input.url });
      return "shared";
    } catch (err: any) {
      // User cancelled the share sheet (AbortError) — fall through to clipboard fallback.
      if (err?.name !== "AbortError") {
        // Some browsers throw without AbortError when sharing fails; still fall back to copy.
      }
    }
  }
  if (input.url && typeof navigator.clipboard?.writeText === "function") {
    await navigator.clipboard.writeText(input.url);
  }
  return "copied";
}
