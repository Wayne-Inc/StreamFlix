import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchTvSeason } from "@/lib/api/tmdb";

const IMG_BASE = "https://image.tmdb.org/t/p/w185";

type Episode = {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
};

export function SeasonEpisodeSelector({
  movieId,
  numberOfSeasons,
  currentSeason,
  currentEpisode,
}: {
  movieId: string;
  numberOfSeasons: number;
  currentSeason?: number;
  currentEpisode?: number;
}) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTvSeason({ data: { id: movieId.replace(/^tv-/, ""), season: selectedSeason } })
      .then((data: any) => {
        if (!cancelled) setEpisodes(data.episodes || []);
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [movieId, selectedSeason]);

  const seasonNumbers = Array.from({ length: numberOfSeasons }, (_, i) => i + 1);

  const formatRating = (v: number) => (v ? v.toFixed(1) : "—");

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Season</p>
        <div className="flex flex-wrap gap-2">
          {seasonNumbers.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeason(s)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                s === selectedSeason
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading episodes…</div>
      ) : episodes.length === 0 ? (
        <div className="text-sm text-muted-foreground">No episodes found.</div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {episodes.map((ep) => (
            <Link
              key={ep.episode_number}
              to="/watch/$id"
              params={{ id: movieId }}
              search={{ season: ep.episode_number === currentEpisode && selectedSeason === currentSeason ? undefined : selectedSeason, episode: ep.episode_number }}
              className={`flex gap-3 rounded-lg border p-3 transition hover:bg-card/80 ${
                currentEpisode === ep.episode_number && currentSeason === selectedSeason
                  ? "border-primary bg-card"
                  : "border-border"
              }`}
            >
              {ep.still_path ? (
                <img
                  src={`${IMG_BASE}${ep.still_path}`}
                  alt=""
                  className="h-20 w-[140px] shrink-0 rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-20 w-[140px] shrink-0 place-items-center rounded bg-surface text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="flex min-w-0 flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                  </p>
                  {ep.overview && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {ep.overview}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {ep.air_date && <span>{ep.air_date}</span>}
                  <span>{formatRating(ep.vote_average)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
