import { createFileRoute } from "@tanstack/react-router";

const WAYBACK_API = "https://web.archive.org/save";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_URLS = 10;
const TIMEOUT_MS = 55_000;

type ArchiveResult = {
  url: string;
  ok: boolean;
  jobId?: string;
  timestamp?: string;
  status?: string;
  error?: string;
};

function siteRoot(): string {
  return ((import.meta.env.VITE_SITE_URL as string | undefined) || "").replace(/\/+$/, "");
}

function archiveKey(): string {
  return ((import.meta.env.WAYBACK_ARCHIVE_KEY as string | undefined) || "").trim();
}

function isAuthorized(request: Request): { ok: boolean; reason?: string } {
  const key = archiveKey();
  if (key && request.headers.get("x-archive-key") === key) return { ok: true };
  const ua = request.headers.get("user-agent") ?? "";
  if (ua.startsWith("Vercel-Cron")) return { ok: true };
  return { ok: false, reason: key ? "missing or invalid x-archive-key header" : "endpoint is protected" };
}

function allowedUrls(request: Request, requested: string[]): { urls: string[]; error?: string } {
  const root = siteRoot();
  const hasKey = archiveKey() !== "" && request.headers.get("x-archive-key") === archiveKey();
  const list = [...new Set(requested.map((u) => u.trim()).filter(Boolean))].slice(0, MAX_URLS);

  if (list.length === 0) {
    if (!root) return { urls: [], error: "no site URL configured and no URLs supplied" };
    return { urls: [root] };
  }

  if (!hasKey && root) {
    const filtered = list.filter((u) => u.startsWith(root));
    if (filtered.length === 0) {
      return { urls: [], error: "no allowed URLs (a valid x-archive-key is required to archive non-site URLs)" };
    }
    return { urls: filtered };
  }

  return { urls: list };
}

async function archiveUrl(target: string, signal: AbortSignal): Promise<ArchiveResult> {
  const encoded = encodeURIComponent(target);

  const save = await fetch(WAYBACK_API, {
    method: "POST",
    redirect: "follow",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": BROWSER_UA,
    },
    body: `url=${encoded}&capture_outlinks=0`,
  });

  const raw = await save.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // non-JSON response — fall back to the legacy endpoint below
  }

  if (json) {
    const message = typeof json.message === "string" ? json.message : undefined;
    const error = typeof json.error === "string" ? json.error : undefined;
    return {
      url: target,
      ok: !error && save.ok,
      jobId: typeof json.job_id === "string" ? json.job_id : undefined,
      timestamp: typeof json.timestamp === "string" ? json.timestamp : undefined,
      status: typeof json.status === "string" ? json.status : message,
      error,
    };
  }

  const legacy = await fetch(`${WAYBACK_API}/${encoded}?capture_outlinks=0`, {
    method: "GET",
    redirect: "follow",
    signal,
    headers: { "User-Agent": BROWSER_UA },
  });
  return { url: target, ok: legacy.ok, status: `legacy ${legacy.status}` };
}

async function runArchive(request: Request, urls: string[]): Promise<Response> {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.reason }, { status: 401 });
  }

  const { urls: targets, error } = allowedUrls(request, urls);
  if (error) {
    return Response.json({ ok: false, error }, { status: 400 });
  }

  const archived: ArchiveResult[] = [];
  for (const target of targets) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      archived.push(await archiveUrl(target, controller.signal));
    } catch (err) {
      archived.push({ url: target, ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      clearTimeout(timer);
    }
  }

  return Response.json({ ok: archived.every((a) => a.ok), archived });
}

function requestedUrlsFromSearch(request: Request): string[] {
  const urls = new URL(request.url).searchParams.get("urls");
  return urls ? urls.split(",") : [];
}

async function requestedUrlsFromBody(request: Request): Promise<string[]> {
  try {
    const body = (await request.json()) as { urls?: unknown };
    if (Array.isArray(body.urls)) {
      return body.urls.filter((u): u is string => typeof u === "string");
    }
  } catch {
    // ignore invalid bodies
  }
  return [];
}

export const Route = createFileRoute("/api/archive")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => runArchive(request, requestedUrlsFromSearch(request)),
      POST: ({ request }: { request: Request }) =>
        requestedUrlsFromBody(request).then((urls) => runArchive(request, urls)),
    },
  },
});
