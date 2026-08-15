import {
  createFileRoute,
  Link,
  notFound,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Play,
  Share2,
  Clapperboard,
  ArrowLeft,
  ShieldOff,
  Check,
  Bookmark,
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  isKidsProfile,
  isRatingBlockedForKids,
  isGenreBlockedForKids,
  filterKidsContent,
} from "@/lib/kids-mode";
import { toast } from "sonner";
import { shareContent } from "@/lib/share";
import { seoMetaFor, siteUrl } from "@/lib/seo";
import { stepsToUsefulBackTarget } from "@/lib/nav-history";
import { getWatchHistory, markAsWatched, unmarkWatched } from "@/lib/continue-watching";
import { isInMyList, toggleMyList } from "@/lib/my-list";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Row } from "@/components/streamflix/Row";
import { Skeleton } from "@/components/ui/skeleton";
import { movieById, loadSimilar, loadRecommendations } from "@/lib/streamflix-data";
import { discoverByGenre } from "@/lib/api/tmdb";
import { SeasonEpisodePicker } from "@/components/streamflix/SeasonEpisodePicker";
import { TrailerModal } from "@/components/streamflix/TrailerModal";
import { AgeRatingBadge } from "@/components/streamflix/AgeRatingBadge";

function MovieSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative min-h-[70vh] pt-16 md:min-h-[85vh] md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] overflow-hidden sm:h-[58vh] md:inset-y-0 md:h-auto">
          <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60" />
        </div>
        <div className="relative z-10 w-full min-w-0 px-4 py-10 sm:px-8 md:px-12 md:py-16 lg:px-16">
          <Skeleton className="mb-6 h-9 w-24 rounded-full" />
          <div className="grid w-full min-w-0 gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="min-w-0 space-y-4 md:col-span-2">
              <Skeleton className="mb-4 h-9 w-3/4 max-w-md rounded sm:h-12" />
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
              <div className="min-w-0">
                <Skeleton className="h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-2/3 max-w-xl rounded sm:h-5" />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
                <Skeleton className="h-10 w-24 rounded-md sm:h-12 sm:w-28" />
                <Skeleton className="h-10 w-24 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="h-10 w-24 rounded-md sm:h-12 sm:w-28" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
              </div>
              <div className="min-w-0 pt-4">
                <Skeleton className="mb-3 h-5 w-16 rounded" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="w-20 shrink-0 aspect-square rounded-xl sm:w-24" />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden min-w-0 md:col-span-1 md:block">
              <Skeleton className="w-full max-w-80 aspect-[2/3] rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/movie/$id")({
  loader: async ({ params }) => {
    const extraGenres = ["27", "878", "35", "53"];
    const [movie, similar, recommendations, ...genreResults] = await Promise.all([
      movieById(params.id),
      loadSimilar(params.id),
      loadRecommendations(params.id),
      ...extraGenres.map((g) => discoverByGenre({ data: { genreId: g } })),
    ]);
    if (!movie) throw notFound();
    const genreRows = extraGenres.map((g, i) => ({
      genreId: g,
      items: (genreResults[i] || []).filter((m: any) => m.id !== params.id).slice(0, 12),
    }));
    return { movie, similar, genreRows, recommendations };
  },
  head: ({ loaderData }) => {
    const movie = loaderData?.movie;
    const title = movie ? `${movie.title} (${movie.year}) — StreamFlix` : "Movie — StreamFlix";
    const description = movie?.description
      ? `${movie.description.slice(0, 200)}`
      : "Watch movies and TV shows on StreamFlix.";
    const image = movie?.backdropSm || movie?.poster || "";
    const site = siteUrl();
    const url = site ? `${site}/movie/${movie?.id ?? ""}` : "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(movie && movie.genres.length
          ? [{ name: "keywords", content: movie.genres.join(", ") }]
          : []),
        ...seoMetaFor(
          title,
          description,
          image,
          movie?.id?.startsWith("tv-") ? "video.tv_show" : "video.movie",
          url,
        ),
      ],
      links: [...(url ? [{ rel: "canonical", href: url }] : [])],
    };
  },
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
  const { movie, similar, genreRows, recommendations } = Route.useLoaderData();
  const genreLabels: Record<string, string> = {
    "27": "Horror",
    "878": "Sci-Fi",
    "35": "Comedy",
    "53": "Thriller",
    "28": "Action",
    "12": "Adventure",
    "18": "Drama",
    "10749": "Romance",
    "9648": "Mystery",
  };
  const isTv = movie.id.startsWith("tv-");
  const [descExpanded, setDescExpanded] = useState(false);
  const castScrollerRef = useRef<HTMLDivElement | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [trailerOpen, setTrailerOpen] = useState(false);

  const [inList, setInList] = useState(false);
  const [watched, setWatched] = useState(false);
  useEffect(() => {
    setInList(isInMyList(movie.id));
    setWatched(getWatchHistory().some((x) => x.id === movie.id || x.id.startsWith(`${movie.id}:`)));
  }, [movie.id]);

  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const goBack = () => {
    const steps = stepsToUsefulBackTarget(location.pathname, [`/watch/${movie.id}`]);
    if (steps !== null) {
      router.history.go(-steps);
    } else {
      navigate({ to: "/browse" });
    }
  };

  const scrollCast = (dir: 1 | -1) => {
    const el = castScrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (7 * 104), behavior: "smooth" });
  };

  const kidsMode = useMemo(() => isKidsProfile(), []);  const blocked =
    kidsMode &&
    (isRatingBlockedForKids(movie.rating) || isGenreBlockedForKids(movie.genreIds ?? []));
  const filteredSimilar = kidsMode ? filterKidsContent(similar) : similar;
  const filteredRecommendations = kidsMode ? filterKidsContent(recommendations) : recommendations;
  const filteredGenreRows = kidsMode
    ? genreRows
        .filter((gr) => filterKidsContent(gr.items).length > 0)
        .map((gr) => ({ ...gr, items: filterKidsContent(gr.items) }))
    : genreRows;

  if (blocked) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="grid min-h-[70vh] place-items-center gap-4 px-4">
          <div className="grid size-24 place-items-center rounded-full bg-amber-500/15">
            <ShieldOff className="size-12 text-amber-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Content not available for kids
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              This title isn't suitable for kids profiles. Try switching to a regular profile to
              watch it.
            </p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative pt-16 md:flex md:min-h-[85vh] md:items-center md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] overflow-hidden sm:h-[58vh] md:inset-y-0 md:h-auto">
          <img src={movie.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 w-full min-w-0 px-4 py-10 sm:px-8 md:px-12 md:py-16 lg:px-16">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="grid w-full min-w-0 gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="min-w-0 space-y-4 md:col-span-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                {movie.score != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-lg sm:px-3 sm:py-1.5">
                    <Star className="size-3 fill-current" /> {movie.score.toFixed(1)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-lg sm:px-3 sm:py-1.5">
                  <Calendar className="size-3" /> {movie.year}
                </span>
                <AgeRatingBadge
                  rating={movie.rating}
                  className="rounded-full px-2.5 py-1 text-xs backdrop-blur-lg sm:px-3 sm:py-1.5"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-lg sm:px-3 sm:py-1.5">
                  <Clock className="size-3" /> {movie.runtime}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genreIds.map((gid: number, i: number) => {
                  const label = genreLabels[String(gid)] || movie.genres[i] || "Explore";
                  return (
                    <Link
                      key={`${gid}-${i}`}
                      to="/explore/$genreId"
                      params={{ genreId: String(gid) }}
                      search={{ q: label }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-lg transition hover:bg-white/10 hover:border-primary/50"
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
              <div className="min-w-0">
                <p
                  className={`max-w-xl break-words text-base md:text-lg text-gray-300 leading-relaxed ${
                    descExpanded ? "" : "line-clamp-3"
                  }`}
                >
                  {movie.description}
                </p>
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1 text-xs font-medium text-primary"
                >
                  {descExpanded ? "Show less" : "Show more"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
                <Link
                  to="/watch/$id"
                  params={{ id: movie.id }}
                  search={{ autoplay: true }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 sm:px-6 sm:py-3"
                >
                  <Play className="size-4 fill-current sm:size-5" /> Play
                </Link>
                {movie.trailer && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/10 sm:px-6 sm:py-3"
                  >
                    <Clapperboard className="size-4 sm:size-5" /> Trailer
                  </button>
                )}
                <button
                  onClick={() => {
                    if (watched) {
                      unmarkWatched(movie.id);
                      setWatched(false);
                      toast.success(`${movie.title} marked as not watched`);
                    } else {
                      markAsWatched(movie);
                      setWatched(true);
                      toast.success(`${movie.title} marked as watched`);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-white/10 sm:px-4 sm:py-3"
                >
                  <Check className="size-4 sm:size-5" /> {watched ? "Watched" : "Unwatched"}
                </button>
                <button
                  onClick={() => {
                    const added = toggleMyList(movie);
                    setInList(added);
                    toast.success(added ? "Added to My List" : "Removed from My List");
                  }}
                  className={`grid size-11 sm:size-12 place-items-center rounded-full border ${
                    inList
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-foreground"
                  }`}
                  aria-label={inList ? "Remove from My List" : "Add to My List"}
                >
                  <Bookmark className={`size-4 sm:size-5 ${inList ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    const base = siteUrl();
                    shareContent({
                      title: `${movie.title} (${movie.year}) — StreamFlix`,
                      text: movie.description.slice(0, 140),
                      url: base ? `${base}/movie/${movie.id}` : window.location.href,
                    }).then((mode) => toast.success(mode === "shared" ? "Shared" : "Link copied"));
                  }}
                  className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground"
                  aria-label="Share"
                >
                  <Share2 className="size-4 sm:size-5" />
                </button>
              </div>

              <div className="min-w-0 pt-4">
                <p className="mb-3 text-sm font-semibold text-foreground sm:text-base">Cast</p>
                <div className="relative min-w-0 max-w-full">
                  {movie.cast.length > 7 && (
                    <button
                      type="button"
                      onClick={() => scrollCast(-1)}
                      aria-label="Scroll cast left"
                      className="absolute left-1 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid sm:size-9"
                    >
                      <ChevronLeft className="size-4 sm:size-5" />
                    </button>
                  )}
                  {movie.cast.length > 7 && (
                    <button
                      type="button"
                      onClick={() => scrollCast(1)}
                      aria-label="Scroll cast right"
                      className="absolute right-1 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid sm:size-9"
                    >
                      <ChevronRight className="size-4 sm:size-5" />
                    </button>
                  )}
                  <div
                    ref={castScrollerRef}
                    className="scrollbar-thin scrollbar-thumb-white/25 scrollbar-track-transparent flex gap-3 overflow-x-auto py-2 backdrop-blur-sm"
                  >
                    {movie.director && (
                      <Link
                        to={movie.directorId ? "/person/$id" : "/search"}
                        params={movie.directorId ? { id: movie.directorId } : {}}
                        search={movie.directorId ? undefined : { q: movie.director, tab: "people" }}
                        className="group z-10 w-20 shrink-0 text-center transition-transform duration-300 ease-out hover:z-20 hover:scale-110 sm:w-24"
                      >
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface ring-1 ring-red-500/70 transition-shadow duration-300 group-hover:shadow-2xl group-hover:ring-2">
                          {movie.directorPfp ? (
                            <img
                              src={movie.directorPfp}
                              alt={movie.director}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                              {movie.director.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="mt-1.5 block truncate text-[11px] font-semibold text-foreground group-hover:text-primary">
                          {movie.director}
                        </span>
                        <span className="block truncate text-[10px] text-red-400">
                          Director
                        </span>
                      </Link>
                    )}
                    {movie.cast.slice(0, 15).map((name: string, i: number) => {
                      const personId = movie.castIds?.[i];
                      const link = personId
                        ? { to: "/person/$id" as const, params: { id: personId } }
                        : {
                            to: "/search" as const,
                            search: { q: name, tab: "people" as const },
                            params: {},
                          };
                      return (
                        <Link
                          key={`${name}-${i}`}
                          to={link.to}
                          {...(link.to === "/search"
                            ? { search: (link as any).search }
                            : { params: (link as any).params })}
                          className="group z-10 w-20 shrink-0 text-center transition-transform duration-300 ease-out hover:z-20 hover:scale-110 sm:w-24"
                        >
                          <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface ring-1 ring-border transition-shadow duration-300 group-hover:shadow-2xl group-hover:ring-2">
                            {movie.castPfp[i] ? (
                              <img
                                src={movie.castPfp[i]}
                                alt={name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                                {name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="mt-1.5 block truncate text-[11px] font-semibold text-foreground group-hover:text-primary">
                            {name}
                          </span>
                          {movie.castRoles?.[i] && (
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {movie.castRoles[i]}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 md:col-span-1">
              {isTv && movie.numberOfSeasons && movie.numberOfSeasons > 0 ? (
                <>
                  <div className="relative hidden w-full overflow-hidden md:block md:w-80">
                    <div
                      className={`flex w-max transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        showPicker ? "-translate-x-[224px]" : "translate-x-0"
                      }`}
                    >
                      <div className="w-80 shrink-0">
                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-white/15">
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">
                              {movie.title.charAt(0)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                      </div>
                      <aside className="-ml-24 w-80 shrink-0 self-center rounded-lg border border-border bg-background/85 p-4 shadow-2xl backdrop-blur-md sm:p-5">
                        <SeasonEpisodePicker movieId={movie.id} numberOfSeasons={movie.numberOfSeasons} />
                      </aside>
                    </div>
                    <div className="absolute inset-y-0 left-2 z-30 hidden items-center md:flex">
                      <button
                        type="button"
                        onClick={() => setShowPicker(false)}
                        disabled={!showPicker}
                        aria-label="Show portrait"
                        className="grid size-8 place-items-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-2 z-30 hidden items-center md:flex">
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        disabled={showPicker}
                        aria-label="Show season picker"
                        className="grid size-8 place-items-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                  <aside className="w-full rounded-lg border border-border bg-background/70 p-4 backdrop-blur-md sm:p-5 md:hidden">
                    <SeasonEpisodePicker movieId={movie.id} numberOfSeasons={movie.numberOfSeasons} />
                  </aside>
                </>
              ) : (
                <div className="hidden w-full md:block md:w-80">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-white/15">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">
                        {movie.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {filteredSimilar.length > 0 && (
        <div className="space-y-2">
          {(() => {
            const groups = new Map<string, typeof filteredSimilar>();
            for (const m of filteredSimilar) {
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

      {filteredRecommendations.length > 0 && (
        <div className="space-y-2 pb-4">
          <Row title="Recommended" items={filteredRecommendations} />
        </div>
      )}

      <div className="space-y-2 pb-10">
        {filteredGenreRows.map((gr) => {
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
