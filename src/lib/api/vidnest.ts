import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const VIDNEST_ALPHABET =
  "RB0fpH8ZEyVLkv7c2i6MAJ5u3IKFDxlS1NTsnGaqmXYdUrtzjwObCgQP94hoeW+/=";

function decodeVidnestPayload(encoded: string): string {
  const charMap = new Map<string, number>();
  for (let i = 0; i < VIDNEST_ALPHABET.length; i++) {
    charMap.set(VIDNEST_ALPHABET[i], i);
  }
  const chars = encoded.split("");
  const blocks: number[] = [];
  for (let i = 0; i < chars.length; i += 4) {
    const c1 = charMap.get(chars[i]) ?? 0;
    const c2 = charMap.get(chars[i + 1]) ?? 0;
    const c3 = charMap.get(chars[i + 2]) ?? 0;
    const c4 = charMap.get(chars[i + 3]) ?? 0;
    blocks.push((c1 << 18) | (c2 << 12) | (c3 << 6) | c4);
  }
  const bytes: number[] = [];
  for (const block of blocks) {
    bytes.push((block >> 16) & 0xff, (block >> 8) & 0xff, block & 0xff);
  }
  if (encoded.endsWith("==")) bytes.length -= 2;
  else if (encoded.endsWith("=")) bytes.length -= 1;
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const VIDNEST_RESOLVERS = [
  "hollymoviehd",
  "allmovies",
  "ophim",
  "klikxxi",
  "moviesapi",
  "flixhq",
  "multiembed",
];

export interface VidNestStream {
  url: string;
  type: "hls" | "mp4";
  language: string;
  referer: string;
  resolver: string;
  subtitles: { url: string; lang: string }[];
}

function buildVidnestPath(
  type: string,
  tmdbId: string,
  season?: number,
  episode?: number,
): string {
  if (type === "tv" && season != null && episode != null) {
    return `tv/${tmdbId}/${season}/${episode}`;
  }
  return `movie/${tmdbId}`;
}

async function fetchVidnestStreams(
  tmdbId: string,
  type: string,
  season?: number,
  episode?: number,
): Promise<VidNestStream[]> {
  const mediaPath = buildVidnestPath(type, tmdbId, season, episode);
  const streams: VidNestStream[] = [];

  const results = await Promise.allSettled(
    VIDNEST_RESOLVERS.map(async (resolver) => {
      const r = await fetch(`https://new.vidnest.fun/${resolver}/${mediaPath}`, {
        headers: {
          "User-Agent": UA,
          Referer: "https://vidnest.fun/",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (r.status !== 200) return [];

      const parsed = (await r.json()) as { data?: string };
      if (!parsed.data) return [];

      const decoded = decodeVidnestPayload(parsed.data);
      let payload: any;
      try {
        payload = JSON.parse(decoded);
      } catch {
        return [];
      }

      const rawStreams = [
        ...(payload.data?.streams || []),
        ...(payload.streams || []),
        ...(payload.data?.sources || []),
        ...(payload.sources || []),
      ];

      const rawDownloads = payload.data?.downloads || [];
      const captions = payload.data?.captions || payload.captions || [];

      const result: VidNestStream[] = [];
      const seen = new Set<string>();

      for (const s of rawStreams) {
        const url = s.url || s.link;
        if (!url || !url.startsWith("http") || seen.has(url)) continue;
        seen.add(url);

        const referer = s.headers?.Referer;
        result.push({
          url,
          type: s.type || (url.includes(".m3u8") ? "hls" : url.includes(".mp4") ? "mp4" : "hls"),
          language: s.language || s.lang || s.quality || "",
          referer: referer && referer.startsWith("http") ? referer : "",
          resolver,
          subtitles: captions
            .filter((c: any) => c.url)
            .map((c: any) => ({
              url: c.url,
              lang: c.lanName || c.lan || "Unknown",
            })),
        });
      }

      for (const d of rawDownloads) {
        if (!d.url || seen.has(d.url)) continue;
        seen.add(d.url);
        result.push({
          url: d.url,
          type: "mp4",
          language: d.resolution ? `${d.resolution}p` : "",
          referer: "",
          resolver,
          subtitles: [],
        });
      }

      return result;
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") streams.push(...r.value);
  }

  return streams;
}

async function probeStream(
  stream: VidNestStream,
): Promise<{ clean: boolean; reason: string }> {
  if (stream.type !== "hls" || !stream.url.includes(".m3u8")) {
    return { clean: true, reason: stream.type === "mp4" ? "mp4-direct" : "unknown" };
  }

  try {
    const headers: Record<string, string> = { "User-Agent": UA };
    if (stream.referer) headers.Referer = stream.referer;

    const r = await fetch(stream.url, {
      headers,
      signal: AbortSignal.timeout(6000),
    });
    const ct = r.headers.get("content-type") || "";

    if (!r.ok && r.status !== 302) {
      return { clean: false, reason: "http-" + r.status };
    }

    if (ct.includes("text/html")) {
      return { clean: false, reason: "html-response" };
    }

    if (!ct.includes("mpegurl") && !ct.includes("m3u8") && !stream.url.includes(".m3u8")) {
      return { clean: true, reason: "non-hls-content" };
    }

    const text = await r.text();
    const lines = text.split("\n");

    const hasAds = lines.some((l) => /PREROLL|MIDROLL|POSTROLL|_ADS_|ADVERTISEMENT/i.test(l));
    const hasDiscontinuities = lines.filter((l) => l.includes("DISCONTINUITY")).length > 2;
    const hasDaterange =
      lines.some((l) => l.includes("DATERANGE") && /ADS|COM/i.test(l));

    const subPlaylist = lines.find((l) => !l.startsWith("#") && l.includes(".m3u8"));
    if (subPlaylist && !hasAds && !hasDiscontinuities) {
      let subUrl = subPlaylist.trim();
      if (!subUrl.startsWith("http")) {
        subUrl = new URL(subUrl, stream.url.replace(/\/[^/]*$/, "/")).href;
      }
      const r2 = await fetch(subUrl, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (r2.ok) {
        const subText = await r2.text();
        const subLines = subText.split("\n");
        const subDiscontinuities = subLines.filter((l) => l.includes("DISCONTINUITY")).length;
        const subAds = subLines.some((l) =>
          /PREROLL|MIDROLL|POSTROLL|_ADS_|ADVERTISEMENT/i.test(l),
        );
        const segments = subLines.filter(
          (l) => !l.startsWith("#") && l.trim() && l.includes(".ts"),
        ).length;

        if (subAds || subDiscontinuities > 2) {
          return {
            clean: false,
            reason: "ads-in-playlist (" + subDiscontinuities + " discontinuities)",
          };
        }
        return { clean: true, reason: "clean-" + segments + "-segments" };
      }
    }

    if (hasAds || hasDiscontinuities) {
      return { clean: false, reason: "ads-in-master" };
    }

    return { clean: true, reason: "clean-master" };
  } catch (e: any) {
    return { clean: false, reason: "probe-error: " + (e?.message || "unknown") };
  }
}

export const resolveVidNestStreams = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      type: z.enum(["movie", "tv"]).default("movie"),
      season: z.number().optional(),
      episode: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const streams = await fetchVidnestStreams(data.id, data.type, data.season, data.episode);

    const probes = await Promise.allSettled(
      streams.map(async (s, i) => {
        const result = await probeStream(s);
        return { index: i, ...result };
      }),
    );

    const cleanIndices = new Set<number>();
    for (const p of probes) {
      if (p.status === "fulfilled" && p.value.clean) {
        cleanIndices.add(p.value.index);
      }
    }

    streams.forEach((s, i) => {
      if (s.type === "mp4") cleanIndices.add(i);
    });

    const clean = streams.filter((_, i) => cleanIndices.has(i));

    clean.sort((a, b) => {
      if (a.type === "mp4" && b.type !== "mp4") return -1;
      if (b.type === "mp4" && a.type !== "mp4") return 1;
      const aEn = /^(?:en|english)/i.test(a.language) ? 1 : 0;
      const bEn = /^(?:en|english)/i.test(b.language) ? 1 : 0;
      return bEn - aEn;
    });

    return { streams: clean, total: clean.length };
  });
