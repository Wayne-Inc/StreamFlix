import { createFileRoute } from "@tanstack/react-router";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function rewriteM3u8(manifest: string, manifestUrl: string, referer: string): string {
  const base = manifestUrl.replace(/\/[^/]*$/, "/");
  return manifest
    .split("\n")
    .map((line) => {
      if (line.startsWith("#") || !line.trim()) return line;
      let abs = line.trim();
      if (!abs.startsWith("http")) {
        abs = new URL(abs, base).href;
      }
      const params = new URLSearchParams({ url: abs });
      if (referer) params.set("referer", referer);
      return `/api/proxy?${params.toString()}`;
    })
    .join("\n");
}

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");
        const referer = url.searchParams.get("referer") || "";

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: "Missing url" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const headers: Record<string, string> = { "User-Agent": UA };
          if (referer) headers.Referer = referer;

          const r = await fetch(targetUrl, {
            headers,
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
          });

          const respHeaders = new Headers({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Accept-Ranges": "bytes",
          });

          const ct = r.headers.get("content-type") || "";
          const cl = r.headers.get("content-length");
          const cr = r.headers.get("content-range");
          if (ct) respHeaders.set("Content-Type", ct);
          if (cl) respHeaders.set("Content-Length", cl);
          if (cr) respHeaders.set("Content-Range", cr);

          const isM3u8 =
            ct.includes("mpegurl") || ct.includes("m3u8") || targetUrl.includes(".m3u8");

          if (isM3u8) {
            const manifest = await r.text();
            const rewritten = rewriteM3u8(manifest, targetUrl, referer);
            respHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
            return new Response(rewritten, { status: r.status, headers: respHeaders });
          }

          if (!r.body) {
            return new Response(null, { status: r.status, headers: respHeaders });
          }

          return new Response(r.body, { status: r.status, headers: respHeaders });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e?.message || "Proxy error" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
