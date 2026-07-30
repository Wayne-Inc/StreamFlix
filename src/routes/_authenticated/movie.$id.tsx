import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Plus, ThumbsUp, Share2, Star, Eye, ExternalLink, EyeOff, Clapperboard, CheckCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Row } from "@/components/streamflix/Row";
import { Skeleton } from "@/components/ui/skeleton";
import { movieById, loadSimilar, loadRecommendations } from "@/lib/streamflix-data";
import { fetchTraktSummary, rateMovie, markAsWatched, addToWatchlist, removeFromWatchlist } from "@/lib/api/trakt";
import { discoverByGenre } from "@/lib/api/tmdb";
import { auth } from "@/lib/firebase";
import { isInMyList, addToMyList, removeFromMyList } from "@/lib/my-list";
import { getUserRating, rateMovie as saveRating } from "@/lib/ratings";
import { StarRating } from "@/components/streamflix/StarRating";
import { SeasonEpisodeSelector } from "@/components/streamflix/SeasonEpisodeSelector";
import { TrailerModal } from "@/components/streamflix/TrailerModal";

function MovieSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      {/* Hero skeleton */}
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden bg-surface/50">
        <div className="flex h-full flex-col items-end md:items-center px-4 sm:px-8 md:px-16 pb-16 md:pb-0">
          {/* On mobile: spacer first pushes title+buttons to bottom; on desktop: at bottom */}
          <div className="flex-1 min-h-4 order-1 md:order-2" />

          <div className="max-w-2xl space-y-4 w-full order-2 md:order-1 mb-4 sm:mb-6 md:mb-0">
            <Skeleton className="h-12 sm:h-14 w-full max-w-md rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <Skeleton className="h-16 w-full max-w-xl rounded" />
            <div className="flex flex-wrap gap-3 pt-2">
              <Skeleton className="h-12 w-24 rounded-md" />
              <Skeleton className="h-12 w-24 rounded-md" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Below-hero skeleton */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-3 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-5 text-sm min-w-0">
          {/* Cast */}
          <div className="min-w-0">
            <Skeleton className="h-5 w-10 rounded mb-3" />
            <div className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 w-[72px] sm:w-20 flex-shrink-0">
                  <Skeleton className="size-12 sm:size-16 rounded-full" />
                  <Skeleton className="h-3 w-14 rounded" />
                  <Skeleton className="h-2 w-10 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-4" />

          {/* Director */}
          <Skeleton className="h-4 w-48 rounded" />

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>

          {/* Rate this */}
          <div>
            <Skeleton className="h-5 w-20 rounded mb-2" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="size-8 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 rounded-lg border border-border bg-surface p-3 sm:p-4 h-auto sm:h-[340px]">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </div>
          <div className="border-t border-border pt-4">
            <Skeleton className="h-5 w-16 rounded mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded bg-surface p-3">
                  <Skeleton className="h-4 w-8 rounded mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/movie/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const extraGenres = ["27", "878", "35", "53"];
    const [movie, similar, recommendations, trakt, ...genreResults] = await Promise.all([
      movieById(params.id),
      loadSimilar(params.id),
      loadRecommendations(params.id),
      fetchTraktSummary({ data: { id: params.id } }),
      ...extraGenres.map((g) => discoverByGenre({ data: { genreId: g } })),
    ]);
    if (!movie) throw notFound();
    const genreRows = extraGenres.map((g, i) => ({ genreId: g, items: (genreResults[i] || []).filter((m: any) => m.id !== params.id).slice(0, 12) }));
    return { movie, similar, trakt, genreRows, recommendations };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.movie.title ?? "Movie"} — StreamFlix` },
      { name: "description", content: loaderData?.movie.description },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-dvh place-items-center bg-background">
      <p className="text-muted-foreground">Title not found.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-dvh place-items-center bg-background">
      <p className="text-muted-foreground">Something went wrong.</p>
    </div>
  ),
  component: MoviePage,
  pendingComponent: MovieSkeleton,
});

function MoviePage() {
  const { movie, similar, trakt, genreRows, recommendations } = Route.useLoaderData();
  const genreLabels: Record<string, string> = { "27": "Horror", "878": "Sci-Fi", "35": "Comedy", "53": "Thriller", "28": "Action", "12": "Adventure", "18": "Drama", "10749": "Romance", "9648": "Mystery" };
  const fmtNum = (n: number | null) => (n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem(`sf:downloaded:${movie.id}`);
    } catch { return false; }
  });

  const handleDownload = async () => {
    if (downloaded) {
      localStorage.removeItem(`sf:downloaded:${movie.id}`);
      setDownloaded(false);
      toast.success("Download removed");
      return;
    }
    toast.loading("Finding source…", { id: "dl" });
    const ok = await import("@/lib/offline").then((m) => m.tryDownloadFromServers(movie.id));
    toast.dismiss("dl");
    if (ok) {
      localStorage.setItem(`sf:downloaded:${movie.id}`, "1");
      setDownloaded(true);
      toast.success("Downloading…");
    } else {
      toast.error("No source available");
    }
  };

  const handleRating = async (rating: number) => {
    const user = auth.currentUser;
    if (!user) { toast.error("Sign in to rate"); return; }
    try {
      await saveRating(user.uid, movie.id, rating);
      setUserRating(rating);
      toast.success(`Rated ${rating}/10`);
    } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => {
    isInMyList(movie.id).then(setInWatchlist);
    getUserRating(movie.id).then(setUserRating);
  }, [movie.id]);

  const handleWatchlist = async () => {
    const conn = getTrakt();
    try {
      if (inWatchlist) {
        await removeFromMyList(movie.id);
        setInWatchlist(false);
        toast.success("Removed from My List");
        if (conn) {
          try {
            await removeFromWatchlist({ data: { token: conn.accessToken, tmdbId: movie.id } });
            toast.success("Removed from Trakt watchlist");
          } catch (e: any) {
            toast.error(e.message || "Failed to remove from Trakt watchlist");
          }
        }
      } else {
        await addToMyList({ id: movie.id, title: movie.title, year: movie.year, poster: movie.poster });
        setInWatchlist(true);
        toast.success("Added to My List");
        if (conn) {
          try {
            await addToWatchlist({ data: { token: conn.accessToken, tmdbId: movie.id } });
            toast.success("Added to Trakt watchlist");
          } catch (e: any) {
            toast.error(e.message || "Failed to add to Trakt watchlist");
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTrakt = () => {
    const raw = localStorage.getItem("streamflix:trakt");
    if (!raw) { toast.error("Connect Trakt in Settings first"); return null; }
    const conn = JSON.parse(raw);
    if (conn.expiresAt && Date.now() > conn.expiresAt) {
      toast.error("Trakt token expired. Disconnect and reconnect in Settings.");
      return null;
    }
    return conn;
  };

  const handleLike = async () => {
    const conn = getTrakt();
    if (!conn) return;
    try {
      await rateMovie({ data: { token: conn.accessToken, tmdbId: movie.id, rating: liked ? 1 : 10 } });
      setLiked(!liked);
      toast.success(liked ? "Unliked" : "Liked!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkWatched = async () => {
    const conn = getTrakt();
    if (!conn) return;
    try {
      await markAsWatched({ data: { token: conn.accessToken, tmdbId: movie.id } });
      setWatched(true);
      toast.success("Marked as watched");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative h-[85vh] min-h-[560px] overflow-hidden pt-16 md:pt-20">
        <img src={movie.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end pb-6 md:pb-16 px-4 sm:px-8 md:px-16 gap-4">
          <div className="flex-1 min-h-0" />

          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-emerald-400">{movie.match}% Match</span>
              <span className="text-muted-foreground">{movie.year}</span>
              <span className="rounded border border-border px-1.5 text-muted-foreground">{movie.rating}</span>
              <span className="text-muted-foreground">{movie.runtime}</span>
            </div>
            <div className={descExpanded ? "max-h-32 overflow-y-auto" : ""}>
              <p className={`max-w-xl text-sm text-foreground/90 sm:text-base ${descExpanded ? "" : "line-clamp-3"}`}>{movie.description}</p>
              <button onClick={() => setDescExpanded((v) => !v)} className="mt-1 text-xs font-medium text-primary">{descExpanded ? "Show less" : "Show more"}</button>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/watch/$id" params={{ id: movie.id }} search={{ autoplay: true }} className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-semibold text-background hover:bg-foreground/85">
                <Play className="size-5 fill-current" /> Play
              </Link>
              {movie.trailer && (
                <button onClick={() => setTrailerOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-semibold text-foreground hover:bg-white/10">
                  <Clapperboard className="size-5" /> Trailer
                </button>
              )}
              <button onClick={handleWatchlist} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={inWatchlist ? "Remove from list" : "Add to list"}>
                {inWatchlist ? <CheckCheck className="size-4 sm:size-5" /> : <Plus className="size-4 sm:size-5" />}
              </button>
              <button onClick={handleLike} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={liked ? "Unlike" : "Like"}>
                <ThumbsUp className={`size-4 sm:size-5 ${liked ? "fill-foreground" : ""}`} />
              </button>
              <button onClick={handleMarkWatched} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={watched ? "Watched" : "Mark watched"}>
                {watched ? <EyeOff className="size-4 sm:size-5" /> : <Eye className="size-4 sm:size-5" />}
              </button>
              <button onClick={handleDownload} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={downloaded ? "Downloaded" : "Download"}>
                <Download className={`size-4 sm:size-5 ${downloaded ? "text-emerald-500" : ""}`} />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label="Share">
                <Share2 className="size-4 sm:size-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-3 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-5 text-sm min-w-0">
          {/* Cast with profile pics */}
          <div className="min-w-0">
            <p className="mb-3 text-base font-semibold text-foreground">Cast</p>
            <div
              className="flex flex-nowrap gap-4 overflow-x-auto pb-3 scrollbar-hide w-full min-w-0"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", overscrollBehaviorX: "contain" }}
            >
              {movie.cast.map((name: string, i: number) => {
                const personId = movie.castIds?.[i];
                const link = personId
                  ? { to: "/person/$id" as const, params: { id: personId } }
                  : { to: "/search" as const, search: { q: name, tab: "people" as const }, params: {} };
                return (
                  <Link
                    key={`${name}-${i}`}
                    to={link.to}
                    {...(link.to === "/search"
                      ? { search: (link as any).search }
                      : { params: (link as any).params })}
                    className="flex min-w-[90px] flex-shrink-0 flex-col items-center gap-1.5 hover:opacity-80 transition w-[90px] sm:min-w-[100px] sm:w-[100px]"
                  >
                    <div className="size-16 sm:size-20 overflow-hidden rounded-xl bg-surface ring-1 ring-border">
                      {movie.castPfp[i] ? (
                        <img src={movie.castPfp[i]} alt={name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs text-center text-muted-foreground leading-tight line-clamp-2">{name}</span>
                    {movie.castRoles?.[i] && (
                      <span className="text-[10px] sm:text-[11px] text-center text-muted-foreground leading-tight line-clamp-2">
                        {movie.castRoles[i]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Director */}
          <p>
            <span className="text-muted-foreground">Director: </span>
            {movie.directorId ? (
              <Link to="/person/$id" params={{ id: movie.directorId }} className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer">{movie.director}</Link>
            ) : (
              <span className="font-medium text-foreground">{movie.director}</span>
            )}
          </p>

          {/* Genres as pills */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((name: string) => (
              <Link
                key={name}
                to="/search"
                search={{ q: name, tab: "genres" }}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground hover:bg-card hover:border-primary/50 transition cursor-pointer"
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Rate this */}
          <div>
            <p className="mb-2 text-base font-semibold text-foreground">Rate this</p>
            <StarRating rating={userRating} onRate={handleRating} />
          </div>

        </div>
        <div className="space-y-4 rounded-lg border border-border bg-surface p-3 text-xs sm:p-4 sm:text-sm h-auto sm:h-[340px]">
          <div>
            <p className="font-semibold text-foreground text-sm sm:text-base">About this title</p>
            <p className="mt-2 text-muted-foreground"></p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Genres:</span> {movie.genres.join(", ")}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Director:</span> {movie.director}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Cast:</span> {movie.cast.length} actors</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Released:</span> {movie.year}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Runtime:</span> {movie.runtime}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Rating:</span> {movie.rating}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Trakt</p>
              {trakt.url && (
                <a href={trakt.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-card/60 py-2">
                <Star className="mx-auto size-4 text-amber-400" />
                <div className="mt-1 font-semibold text-foreground">{trakt.rating != null ? trakt.rating.toFixed(1) : "—"}</div>
                <div className="text-[11px] text-muted-foreground">{fmtNum(trakt.votes)} votes</div>
              </div>
              <div className="rounded bg-card/60 py-2">
                <Eye className="mx-auto size-4 text-sky-400" />
                <div className="mt-1 font-semibold text-foreground">{fmtNum(trakt.watchers)}</div>
                <div className="text-[11px] text-muted-foreground">watching</div>
              </div>
              <div className="rounded bg-card/60 py-2">
                <Play className="mx-auto size-4 text-emerald-400" />
                <div className="mt-1 font-semibold text-foreground">{fmtNum(trakt.plays)}</div>
                <div className="text-[11px] text-muted-foreground">plays</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {movie.numberOfSeasons && movie.numberOfSeasons > 0 && (
        <SeasonEpisodeSelector
          movieId={movie.id}
          numberOfSeasons={movie.numberOfSeasons}
        />
      )}

      {similar.length > 0 && (
        <div className="space-y-2">
          {(() => {
            const groups = new Map<string, typeof similar>();
            for (const m of similar) {
              const g = m.genres[0] || "Other";
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(m);
            }
            return Array.from(groups.entries()).map(([genre, items]) => (
              <Row key={genre} title={`More ${genre}`} items={items} />
            ));
          })()}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2 pb-4">
          <Row title="Recommended" items={recommendations} />
        </div>
      )}

      <div className="space-y-2 pb-10">
        {genreRows.map((gr) => {
          const label = genreLabels[gr.genreId] || "Others You May Like";
          return <Row key={gr.genreId} title={`${label} Movies`} items={gr.items} />;
        })}
      </div>

      {trailerOpen && movie.trailer && (
        <TrailerModal url={movie.trailer} onClose={() => setTrailerOpen(false)} />
      )}
      <Footer />
    </div>
  );
}