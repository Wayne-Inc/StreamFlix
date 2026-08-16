import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fetchTrending = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/movie/week");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchTrendingDay = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/movie/day");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchTrendingAllDay = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/all/day");
  return (data.results || []).map((m: any) => (m.media_type === "tv" ? toTv(m) : toMovie(m)));
});

export const fetchTrendingAllWeek = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/all/week");
  return (data.results || []).map((m: any) => (m.media_type === "tv" ? toTv(m) : toMovie(m)));
});

export const fetchPopular = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/movie/popular");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchNowPlaying = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/movie/now_playing");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchTopRated = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/movie/top_rated");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchUpcoming = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const [page1, page2] = await Promise.all([
    tmdbFetch("/movie/upcoming", { page: "1" }),
    tmdbFetch("/movie/upcoming", { page: "2" }),
  ]);
  const seen = new Set<string>();
  const all = [...(page1.results || []), ...(page2.results || [])].filter((m: any) => {
    if (!m.id || seen.has(String(m.id))) return false;
    seen.add(String(m.id));
    return true;
  });
  return all.map((m: any) => toMovie(m));
});

export const fetchUpcomingTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdbFetch("/discover/tv", {
    sort_by: "first_air_date.asc",
    "first_air_date.gte": today,
  });
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchPopularUpcoming = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdbFetch("/discover/movie", {
    sort_by: "popularity.desc",
    "release_date.gte": today,
    "vote_count.gte": "10",
  });
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchPopularUpcomingTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdbFetch("/discover/tv", {
    sort_by: "popularity.desc",
    "first_air_date.gte": today,
    "vote_count.gte": "10",
  });
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchNewMovies = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 90);
  const gte = start.toISOString().slice(0, 10);
  const lte = today.toISOString().slice(0, 10);
  const data = await tmdbFetch("/discover/movie", {
    sort_by: "primary_release_date.desc",
    "primary_release_date.gte": gte,
    "primary_release_date.lte": lte,
  });
  return (data.results || []).map((m: any) => toMovie(m));
});

export type CalendarTitle = {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  releaseDate: string;
  year: number;
  genreIds: number[];
  media: "movie" | "tv";
};

export const fetchUpcomingCalendar = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch } = await import("./tmdb.server");
  const data = await tmdbFetch("/movie/upcoming", { page: "1" });
  return (data.results || []).map((m: any): CalendarTitle => ({
    id: String(m.id),
    title: m.title ?? "",
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : "",
    releaseDate: m.release_date ?? "",
    year: m.release_date ? new Date(m.release_date).getFullYear() : new Date().getFullYear(),
    genreIds: m.genre_ids || [],
    media: "movie",
  }));
});

export const fetchAiringCalendar = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch } = await import("./tmdb.server");
  const data = await tmdbFetch("/tv/on_the_air", { page: "1" });
  return (data.results || []).map((m: any): CalendarTitle => ({
    id: `tv-${m.id}`,
    title: m.name ?? "",
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : "",
    releaseDate: m.first_air_date ?? "",
    year: m.first_air_date ? new Date(m.first_air_date).getFullYear() : new Date().getFullYear(),
    genreIds: m.genre_ids || [],
    media: "tv",
  }));
});

export const probeEmbedUrl = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch {
      return false;
    }
  });

// ---- TV ----
export const fetchTrendingTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/tv/week");
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchTrendingTvDay = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/tv/day");
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchPopularTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/tv/popular");
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchTopRatedTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/tv/top_rated");
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchAiringTv = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toTv } = await import("./tmdb.server");
  const data = await tmdbFetch("/tv/on_the_air");
  return (data.results || []).map((m: any) => toTv(m));
});

export const fetchMovie = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
    if (data.id.startsWith("tv-")) {
      const realId = data.id.slice(3);
      const m = await tmdbFetch(`/tv/${realId}`, { append_to_response: "credits,videos,content_ratings" });
      return toTv(m);
    }
    const m = await tmdbFetch(`/movie/${data.id}`, { append_to_response: "credits,videos,release_dates" });
    return toMovie(m);
  });

export const fetchSimilar = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
    if (data.id.startsWith("tv-")) {
      const realId = data.id.slice(3);
      const res = await tmdbFetch(`/tv/${realId}/similar`);
      return (res.results || []).slice(0, 10).map((m: any) => toTv(m));
    }
    const res = await tmdbFetch(`/movie/${data.id}/similar`);
    return (res.results || []).slice(0, 10).map((m: any) => toMovie(m));
  });

export const searchMovies = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
    const [res1, res2, res3] = await Promise.all([
      tmdbFetch("/search/multi", { query: data.query, page: "1" }),
      tmdbFetch("/search/multi", { query: data.query, page: "2" }),
      tmdbFetch("/search/multi", { query: data.query, page: "3" }),
    ]);
    const combined = [
      ...(res1.results || []),
      ...(res2.results || []),
      ...(res3.results || []),
    ];
    return combined
      .filter((m: any) => m.media_type === "movie" || m.media_type === "tv")
      .map((m: any) => (m.media_type === "tv" ? toTv(m) : toMovie(m)));
  });

export type SearchSort = "relevance" | "popularity" | "rating" | "year" | "title";

export type SearchFilterInput = {
  query?: string;
  genreId?: number;
  year?: number;
  minRating?: number;
  sort?: SearchSort;
};

function sortRawMovies(list: any[], sort?: SearchSort) {
  switch (sort) {
    case "popularity":
      list.sort((a: any, b: any) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
      break;
    case "rating":
      list.sort((a: any, b: any) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      break;
    case "year":
      list.sort((a: any, b: any) =>
        String(b.release_date ?? "").localeCompare(String(a.release_date ?? "")),
      );
      break;
    case "title":
      list.sort((a: any, b: any) =>
        String(a.title ?? a.name ?? "").localeCompare(String(b.title ?? b.name ?? "")),
      );
      break;
    default:
      break;
  }
  return list;
}

function dedupeMovies(list: any[]) {
  const seen = new Set<string>();
  return list.filter((m: any) => {
    if (!m.id) return false;
    const key = String(m.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const searchFiltered = createServerFn({ method: "POST" })
  .validator(
    z.object({
      query: z.string().optional().catch(""),
      genreId: z.number().optional().catch(undefined),
      year: z.number().optional().catch(undefined),
      minRating: z.number().optional().catch(undefined),
      sort: z
        .enum(["relevance", "popularity", "rating", "year", "title"])
        .optional()
        .catch(undefined),
    }),
  )
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie } = await import("./tmdb.server");
    const q = (data.query ?? "").trim();

    const sortBy = (sort?: SearchSort) => {
      switch (sort) {
        case "rating":
          return "vote_average.desc";
        case "year":
          return "primary_release_date.desc";
        case "title":
          return "original_title.asc";
        case "popularity":
          return "popularity.desc";
        default:
          return "popularity.desc";
      }
    };

    if (q.length >= 2) {
      const pages = await Promise.all(
        [1, 2, 3, 4].map((p) =>
          tmdbFetch("/search/movie", {
            query: q,
            page: String(p),
            ...(data.year ? { primary_release_year: String(data.year) } : {}),
          }).catch(() => ({ results: [] })),
        ),
      );
      let list = dedupeMovies(pages.flatMap((r: any) => r.results || []));
      if (data.genreId) {
        list = list.filter((m: any) => (m.genre_ids || []).includes(data.genreId));
      }
      if (data.minRating) {
        list = list.filter((m: any) => (m.vote_average ?? 0) >= (data.minRating ?? 0));
      }
      sortRawMovies(list, data.sort);
      return list.map((m: any) => toMovie(m));
    }

    const params: Record<string, string> = {
      sort_by: sortBy(data.sort),
    };
    if (data.genreId) params.with_genres = String(data.genreId);
    if (data.year) params.primary_release_year = String(data.year);
    if (data.minRating) params["vote_average.gte"] = String(data.minRating);
    const pages = await Promise.all(
      [1, 2, 3, 4].map((p) =>
        tmdbFetch("/discover/movie", { ...params, page: String(p) }).catch(() => ({
          results: [],
        })),
      ),
    );
    return dedupeMovies(pages.flatMap((r: any) => r.results || [])).map((m: any) => toMovie(m));
  });

export const suggestTitles = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { tmdbFetch } = await import("./tmdb.server");
    const res = await tmdbFetch("/search/multi", { query: data.query, page: "1" });
    return (res.results || [])
      .filter((m: any) => m.media_type === "movie" || m.media_type === "tv")
      .slice(0, 8)
      .map((m: any) => ({
        id: m.media_type === "tv" ? `tv-${m.id}` : String(m.id),
        title: m.title || m.name || "Untitled",
        year: m.release_date || m.first_air_date ? Number((m.release_date || m.first_air_date).slice(0, 4)) : null,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : "",
        mediaType: m.media_type,
        genreIds: m.genre_ids || [],
      }));
  });

export const discoverByGenre = createServerFn({ method: "POST" })
  .validator(z.object({ genreId: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie } = await import("./tmdb.server");
    const [res1, res2, res3] = await Promise.all([
      tmdbFetch("/discover/movie", {
        with_genres: data.genreId,
        sort_by: "popularity.desc",
        page: "1",
      }),
      tmdbFetch("/discover/movie", {
        with_genres: data.genreId,
        sort_by: "popularity.desc",
        page: "2",
      }),
      tmdbFetch("/discover/movie", {
        with_genres: data.genreId,
        sort_by: "popularity.desc",
        page: "3",
      }),
    ]);
    const combined = [
      ...(res1.results || []),
      ...(res2.results || []),
      ...(res3.results || []),
    ];
    return combined.map((m: any) => toMovie(m));
  });

export const discoverByGenreMixed = createServerFn({ method: "POST" })
  .validator(z.object({ genreId: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch("/discover/movie", {
        with_genres: data.genreId,
        sort_by: "popularity.desc",
        page: "1",
      }),
      tmdbFetch("/discover/tv", {
        with_genres: data.genreId,
        sort_by: "popularity.desc",
        page: "1",
      }),
    ]);
    const seen = new Set<string>();
    return [...(movieRes.results || []).map((m: any) => toMovie(m)), ...(tvRes.results || []).map((m: any) => toTv(m))].filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  });

export const fetchMoviesByIds = createServerFn({ method: "POST" })
  .validator(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie } = await import("./tmdb.server");
    const results: PromiseSettledResult<any>[] = await Promise.allSettled(
      data.ids.map((tmdbId: string) =>
        tmdbFetch(`/movie/${tmdbId}`, { append_to_response: "videos" }),
      ),
    );
    return results
      .filter(
        (r: PromiseSettledResult<any>): r is PromiseFulfilledResult<any> =>
          r.status === "fulfilled",
      )
      .map((r: PromiseFulfilledResult<any>) => toMovie(r.value));
  });

export const fetchRecommendations = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie, toTv } = await import("./tmdb.server");
    if (data.id.startsWith("tv-")) {
      const realId = data.id.slice(3);
      const res = await tmdbFetch(`/tv/${realId}/recommendations`);
      return (res.results || []).slice(0, 10).map((m: any) => toTv(m));
    }
    const res = await tmdbFetch(`/movie/${data.id}/recommendations`);
    return (res.results || []).slice(0, 10).map((m: any) => toMovie(m));
  });

export const searchPeople = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { tmdbFetch } = await import("./tmdb.server");
    const res = await tmdbFetch("/search/person", { query: data.query });
    return (res.results || []).slice(0, 10).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      known_for: (p.known_for || [])
        .map((k: any) => k.title || k.name || "")
        .filter(Boolean)
        .join(", "),
      photo: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : "",
    }));
  });

export const fetchGenres = createServerFn({ method: "GET" }).handler(async () => {
  const { tmdbFetch } = await import("./tmdb.server");
  const data = await tmdbFetch("/genre/movie/list");
  return (data.genres || []) as { id: number; name: string }[];
});

export const fetchTvSeason = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), season: z.number() }))
  .handler(async ({ data }) => {
    const { tmdbFetch } = await import("./tmdb.server");
    return tmdbFetch(`/tv/${data.id}/season/${data.season}`, { append_to_response: "credits" });
  });

export const fetchMovieVideos = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { fetchMovieVideosData } = await import("./tmdb.server");
    return fetchMovieVideosData(data.id);
  });

export const fetchTitleLogo = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch } = await import("./tmdb.server");
    const isTv = data.id.startsWith("tv-");
    const tmdbId = isTv ? data.id.slice(3) : data.id;
    const res = await tmdbFetch(`/${isTv ? "tv" : "movie"}/${tmdbId}/images`, {
      include_image_language: "en,null",
    });
    const logos: any[] = Array.isArray(res.logos) ? res.logos : [];
    if (!logos.length) return null;
    const candidates = [...logos].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    const best =
      candidates.find((l) => l.iso_639_1 === "en") ??
      candidates.find((l) => l.iso_639_1 === null) ??
      candidates[0];
    if (!best?.file_path) return null;
    return {
      filePath: best.file_path,
      width: best.width ?? 0,
      height: best.height ?? 0,
    };
  });

export const enrichCertifications = createServerFn({ method: "POST" })
  .validator(z.object({ items: z.array(z.any()) }))
  .handler(async ({ data }) => {
    const { enrichCertifications: enrich } = await import("./tmdb.server");
    return enrich(data.items);
  });

export const fetchPersonDetails = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch } = await import("./tmdb.server");
    const person = await tmdbFetch(`/person/${data.id}`);
    const credits = await tmdbFetch(`/person/${data.id}/combined_credits`);
    const mapCredit = (c: any) => ({
      id: c.media_type === "tv" ? `tv-${c.id}` : String(c.id),
      title: c.title || c.name || "Untitled",
      character: c.character || "",
      year: c.release_date
        ? new Date(c.release_date).getFullYear()
        : c.first_air_date
          ? new Date(c.first_air_date).getFullYear()
          : null,
      backdrop: c.backdrop_path ? `https://image.tmdb.org/t/p/w780${c.backdrop_path}` : "",
      poster: c.poster_path ? `https://image.tmdb.org/t/p/w342${c.poster_path}` : "",
    });
    return {
      id: String(person.id),
      name: person.name,
      photo: person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : "",
      bio: person.biography || "No biography available.",
      birthday: person.birthday || "",
      deathday: person.deathday || "",
      birthplace: person.place_of_birth || "",
      department: person.known_for_department || "Actor",
      movies: (credits.cast || []).filter((c: any) => c.media_type === "movie").map(mapCredit),
      tvShows: (credits.cast || []).filter((c: any) => c.media_type === "tv").map(mapCredit),
    };
  });
