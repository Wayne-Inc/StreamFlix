import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fetchTrending = createServerFn({ method: "POST" }).handler(async () => {
  const { tmdbFetch, toMovie } = await import("./tmdb.server");
  const data = await tmdbFetch("/trending/movie/week");
  return (data.results || []).map((m: any) => toMovie(m));
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
  const data = await tmdbFetch("/movie/upcoming");
  return (data.results || []).map((m: any) => toMovie(m));
});

export const fetchTrendingByRegion = createServerFn({ method: "POST" })
  .validator(z.object({ region: z.string().min(2).max(10) }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie } = await import("./tmdb.server");
    const res = await tmdbFetch("/trending/movie/week", { region: data.region });
    return (res.results || []).map((m: any) => toMovie(m));
  });

export const fetchCountries = createServerFn({ method: "GET" }).handler(async () => {
  const { tmdbFetch } = await import("./tmdb.server");
  const data = await tmdbFetch("/configuration/countries");
  return (data || []).map((c: any) => ({
    iso: String(c.iso_3166_1),
    name: c.english_name ?? c.native_name ?? String(c.iso_3166_1),
  }));
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
      const m = await tmdbFetch(`/tv/${realId}`, { append_to_response: "credits,videos" });
      return toTv(m);
    }
    const m = await tmdbFetch(`/movie/${data.id}`, { append_to_response: "credits,videos" });
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
