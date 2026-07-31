import { probeDownloadSources } from "@/lib/api/downloads.server";

export type DownloadResult = {
  ok: boolean;
  url: string | null;
  name: string | null;
  direct: boolean;
};

export async function tryDownloadFromServers(
  id: string,
  season?: number,
  episode?: number,
): Promise<DownloadResult> {
  try {
    const results = await probeDownloadSources({ data: { id, season, episode } });
    const direct = results.find((r) => r.direct);
    if (direct) {
      return { ok: true, url: direct.url, name: direct.name, direct: true };
    }
    const embed = results.find((r) => r.contentType !== "error" && r.url);
    if (embed) {
      return { ok: true, url: embed.url, name: embed.name, direct: false };
    }
  } catch {}
  return { ok: false, url: null, name: null, direct: false };
}

export function openDownloadSource(result: DownloadResult) {
  if (!result.url) return;
  window.open(result.url, "_blank", "noopener,noreferrer");
}
