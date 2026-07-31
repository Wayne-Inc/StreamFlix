import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DOWNLOAD_SERVERS, buildEmbedUrl } from "../download-sources";

export type DownloadSourceProbe = {
  name: string;
  url: string;
  direct: boolean;
  contentType: string;
  size: number | null;
};

export const probeDownloadSources = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      season: z.number().optional(),
      episode: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const results: DownloadSourceProbe[] = [];
    for (const server of DOWNLOAD_SERVERS) {
      const url = buildEmbedUrl(data.id, server.name, data.season, data.episode);
      if (!url) {
        continue;
      }
      try {
        const res = await fetch(url, { redirect: "follow" });
        const contentType = res.headers.get("content-type") || "";
        const length = res.headers.get("content-length");
        results.push({
          name: server.name,
          url: res.url || url,
          direct:
            contentType.startsWith("video/") ||
            contentType.startsWith("application/octet-stream"),
          contentType,
          size: length ? parseInt(length, 10) : null,
        });
      } catch {
        results.push({
          name: server.name,
          url,
          direct: false,
          contentType: "error",
          size: null,
        });
      }
    }
    return results;
  });
