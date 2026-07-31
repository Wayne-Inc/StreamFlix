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
    const res = await tmdbFetch("/search/multi", { query: data.query });
    return (res.results || [])
      .filter((m: any) => m.media_type === "movie" || m.media_type === "tv")
      .map((m: any) => (m.media_type === "tv" ? toTv(m) : toMovie(m)));
  });

export const discoverByGenre = createServerFn({ method: "POST" })
  .validator(z.object({ genreId: z.string() }))
  .handler(async ({ data }) => {
    const { tmdbFetch, toMovie } = await import("./tmdb.server");
    const res = await tmdbFetch("/discover/movie", {
      with_genres: data.genreId,
      sort_by: "popularity.desc",
    });
    return (res.results || []).map((m: any) => toMovie(m));
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
