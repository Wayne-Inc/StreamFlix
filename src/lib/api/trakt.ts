import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TraktTrendingItem = {
  tmdbId: string;
  title: string;
  year: number;
  watchers: number;
};

export type TraktSummary = {
  rating: number | null;
  votes: number | null;
  watchers: number | null;
  plays: number | null;
  url: string | null;
};

export const fetchTraktTrending = createServerFn({ method: "POST" }).handler(async () => {
  const { traktFetch } = await import("./trakt.server");
  const data = await traktFetch("/movies/trending?limit=20&extended=full");
  if (!data) return [];
  return data.map((item: any) => ({
    tmdbId: String(item.movie.ids.tmdb),
    title: item.movie.title,
    year: item.movie.year,
    watchers: item.watchers,
  })) as TraktTrendingItem[];
});

export const fetchTraktPopular = createServerFn({ method: "POST" }).handler(async () => {
  const { traktFetch } = await import("./trakt.server");
  const data = await traktFetch("/movies/popular?limit=20&extended=full");
  if (!data) return [];
  return data.map((item: any) => ({
    tmdbId: String(item.ids.tmdb),
    title: item.title,
    year: item.year,
  }));
});

export const fetchTraktSummary = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<TraktSummary> => {
    const empty: TraktSummary = {
      rating: null,
      votes: null,
      watchers: null,
      plays: null,
      url: null,
    };
    try {
      const { traktFetch } = await import("./trakt.server");
      const isTv = data.id.startsWith("tv-");
      const tmdbId = isTv ? data.id.slice(3) : data.id;
      const type = isTv ? "show" : "movie";
      const found = await traktFetch(`/search/tmdb/${tmdbId}?type=${type}`);
      if (!found || !found.length) return empty;
      const node = isTv ? found[0].show : found[0].movie;
      if (!node?.ids?.slug) return empty;
      const slug = node.ids.slug;
      const base = isTv ? "shows" : "movies";
      const [stats, summary] = await Promise.all([
        traktFetch(`/${base}/${slug}/stats`),
        traktFetch(`/${base}/${slug}?extended=full`),
      ]);
      return {
        rating: summary?.rating ?? null,
        votes: summary?.votes ?? null,
        watchers: stats?.watchers ?? null,
        plays: stats?.plays ?? null,
        url: `https://trakt.tv/${base}/${slug}`,
      };
    } catch {
      return empty;
    }
  });

export const exchangeTraktCode = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string(), redirectUri: z.string() }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId, traktClientSecret } = getServerConfig();
    if (!traktClientId || !traktClientSecret) {
      throw new Error("Trakt not configured");
    }
    const res = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "StreamFlix/1.0",
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
      },
      body: JSON.stringify({
        code: data.code,
        client_id: traktClientId,
        client_secret: traktClientSecret,
        redirect_uri: data.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Trakt token exchange failed: ${res.status}${body ? ` — ${body}` : ""}`);
    }
    const token = await res.json();
    const me = await fetch("https://api.trakt.tv/users/settings", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
      },
    });
    const profile = me.ok ? await me.json() : null;
    return {
      accessToken: token.access_token as string,
      refreshToken: token.refresh_token as string,
      expiresIn: token.expires_in as number,
      username: profile?.user?.username ?? null,
      name: profile?.user?.name ?? null,
      avatar: profile?.user?.images?.avatar?.full ?? null,
    };
  });

export const getTraktClientId = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerConfig } = await import("../config.server");
  return { clientId: getServerConfig().traktClientId || null };
});

function traktError(prefix: string, res: Response): never {
  const msg =
    res.status === 403
      ? `${prefix}: 403 — Trakt token expired. Disconnect and reconnect in Settings.`
      : `${prefix}: ${res.status}`;
  throw new Error(msg);
}

export const addToWatchlist = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), tmdbId: z.string() }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId } = getServerConfig();
    if (!traktClientId) throw new Error("Trakt not configured");
    const res = await fetch("https://api.trakt.tv/sync/watchlist", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movies: [{ ids: { tmdb: Number(data.tmdbId) } }] }),
    });
    if (!res.ok) traktError("Failed to add to watchlist", res);
    return { added: true };
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), tmdbId: z.string() }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId } = getServerConfig();
    if (!traktClientId) throw new Error("Trakt not configured");
    const res = await fetch("https://api.trakt.tv/sync/watchlist/remove", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movies: [{ ids: { tmdb: Number(data.tmdbId) } }] }),
    });
    if (!res.ok) traktError("Failed to remove from watchlist", res);
    return { removed: true };
  });

export const rateMovie = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), tmdbId: z.string(), rating: z.number().min(1).max(10) }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId } = getServerConfig();
    if (!traktClientId) throw new Error("Trakt not configured");
    const res = await fetch("https://api.trakt.tv/sync/ratings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        movies: [{ ids: { tmdb: Number(data.tmdbId) }, rating: data.rating }],
      }),
    });
    if (!res.ok) traktError("Rate failed", res);
    return { rated: true };
  });

export const markAsWatched = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), tmdbId: z.string() }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId } = getServerConfig();
    if (!traktClientId) throw new Error("Trakt not configured");
    const now = new Date().toISOString().split("T")[0];
    const res = await fetch("https://api.trakt.tv/sync/history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movies: [{ ids: { tmdb: Number(data.tmdbId) }, watched_at: now }] }),
    });
    if (!res.ok) traktError("Mark watched failed", res);
    return { watched: true };
  });

export const fetchTraktWatchlist = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { getServerConfig } = await import("../config.server");
    const { traktClientId } = getServerConfig();
    if (!traktClientId) return [];
    const res = await fetch("https://api.trakt.tv/sync/watchlist/movies?extended=full", {
      headers: {
        Authorization: `Bearer ${data.token}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const items = await res.json();
    return items.map((item: any) => ({
      tmdbId: String(item.movie.ids.tmdb),
      title: item.movie.title,
      year: item.movie.year,
      poster: item.movie.images?.poster?.full ?? null,
    }));
  });
