type SeoMetaEntry = {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
};

export function siteUrl() {
  return ((import.meta.env.VITE_SITE_URL as string | undefined) || "").replace(/\/+$/, "");
}

export function seoMetaFor(
  title: string,
  description: string,
  image: string,
  type: "video.movie" | "video.tv_show",
  url: string,
): SeoMetaEntry[] {
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(image ? [{ property: "og:image", content: image }] : []),
    ...(url ? [{ property: "og:url", content: url }] : []),
    { property: "og:type", content: type },
    { property: "og:site_name", content: "StreamFlix" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(image ? [{ name: "twitter:image", content: image }] : []),
  ];
}
