const DOWNLOAD_SERVERS: { name: string; movie: string; tv: string }[] = [
  { name: "VSEmbed", movie: "https://vsembed.su/embed/movie/{id}", tv: "https://vsembed.su/embed/tv/{id}/{season}/{episode}" },
  { name: "AutoEmbed", movie: "https://player.autoembed.cc/embed/movie/{id}", tv: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}" },
  { name: "2Embed", movie: "https://www.2embed.cc/embed/{id}", tv: "https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}" },
  { name: "MultiEmbed", movie: "https://multiembed.mov/?video_id={id}&tmdb=1", tv: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}" },
  { name: "VidEasy", movie: "https://player.videasy.net/movie/{id}", tv: "https://player.videasy.net/tv/{id}/{season}/{episode}" },
  { name: "SmashyStream", movie: "https://embed.smashystream.com/playere.php?tmdb={id}", tv: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}" },
  { name: "P-Stream", movie: "https://iframe.pstream.org/embed/tmdb-movie-{id}", tv: "https://iframe.pstream.org/embed/tmdb-tv-{id}/{season}/{episode}" },
  { name: "VidSrc CC", movie: "https://vidsrc.cc/v2/embed/movie/{id}", tv: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}" },
  { name: "Embed.su", movie: "https://embed.su/embed/movie/{id}", tv: "https://embed.su/embed/tv/{id}/{season}/{episode}" },
  { name: "VidSrc.to", movie: "https://vidsrc.to/embed/movie/{id}", tv: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}" },
];

function buildUrl(id: string, season?: number, episode?: number): { url: string; name: string } | null {
  const isTv = id.startsWith("tv-");
  const realId = isTv ? id.slice(3) : id;
  for (const s of DOWNLOAD_SERVERS) {
    let url = isTv ? s.tv : s.movie;
    url = url.replace("{id}", realId);
    if (season != null) url = url.replace("{season}", String(season));
    if (episode != null) url = url.replace("{episode}", String(episode));
    return { url, name: s.name };
  }
  return null;
}

export async function tryDownloadFromServers(id: string, season?: number, episode?: number): Promise<boolean> {
  const isTv = id.startsWith("tv-");
  const realId = isTv ? id.slice(3) : id;

  for (const s of DOWNLOAD_SERVERS) {
    let url = isTv ? s.tv : s.movie;
    url = url.replace("{id}", realId);
    if (season != null) url = url.replace("{season}", String(season));
    if (episode != null) url = url.replace("{episode}", String(episode));

    try {
      const res = await fetch(url, { mode: "cors" });
      const contentType = res.headers.get("content-type") || "";

      if (contentType.startsWith("video/") || contentType.startsWith("application/octet-stream")) {
        const blob = await res.blob();
        triggerDownload(blob, `${realId}.mp4`);
        return true;
      }
    } catch {}

    try {
      const res = await fetch(url, { mode: "no-cors" });
      if (res.type === "opaque") {
        const cache = await caches.open("streamflix-offline-v1");
        await cache.put(url, res.clone());
        const cached = await cache.match(url);
        if (cached) {
          const blob = await cached.blob();
          if (blob.type.startsWith("video/") || blob.type.startsWith("application/octet-stream") || blob.size > 1024 * 1024) {
            triggerDownload(blob, `${realId}.mp4`);
            return true;
          }
        }
      }
    } catch {}
  }

  return false;
}

function triggerDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
