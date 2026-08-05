import {
  createFileRoute,
  Link,
  notFound,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Share2, Clapperboard, ArrowLeft, ShieldOff } from "lucide-react";
import { isKidsProfile, isRatingBlockedForKids, isGenreBlockedForKids, filterKidsContent } from "@/lib/kids-mode";
import { toast } from "sonner";
import { shareContent } from "@/lib/share";
import { seoMetaFor, siteUrl } from "@/lib/seo";
import { stepsToUsefulBackTarget } from "@/lib/nav-history";
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
      {/* Hero skeleton */}
      <section className="relative min-h-[70vh] overflow-hidden bg-surface/50 pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 md:px-16 md:py-16">
          <div className="grid w-full gap-10 md:grid-cols-3 md:gap-8">
            <div className="space-y-4 md:col-span-2">
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
              </div>
            </div>

            <aside className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
              <Skeleton className="h-5 w-32 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-3/5 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            </aside>
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
        ...(movie && movie.genres.length ? [{ name: "keywords", content: movie.genres.join(", ") }] : []),
        ...seoMetaFor(title, description, image, movie?.id?.startsWith("tv-") ? "video.tv_show" : "video.movie", url),
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

  const [trailerOpen, setTrailerOpen] = useState(false);

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

  const kidsMode = useMemo(() => isKidsProfile(), []);
  const blocked = kidsMode && (isRatingBlockedForKids(movie.rating) || isGenreBlockedForKids(movie.genreIds ?? []));
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
            <h2 className="text-xl font-semibold text-foreground">Content not available for kids</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              This title isn't suitable for kids profiles. Try switching to a regular profile to watch it.
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
      <section className="relative overflow-hidden pt-16 md:flex md:min-h-[85vh] md:items-center md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] sm:h-[58vh] md:inset-y-0 md:h-auto">
          <img src={movie.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 md:px-16 md:py-16">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="grid w-full gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="space-y-4 md:col-span-2">
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-emerald-400">{movie.match}% Match</span>
                <span className="text-muted-foreground">{movie.year}</span>
                <AgeRatingBadge rating={movie.rating} />
                <span className="text-muted-foreground">{movie.runtime}</span>
              </div>
              <div>
                <p
                  className={`max-w-xl text-sm text-foreground/90 sm:text-base ${
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

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/watch/$id"
                  params={{ id: movie.id }}
                  search={{ autoplay: true }}
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-semibold text-background hover:bg-foreground/85"
                >
                  <Play className="size-5 fill-current" /> Play
                </Link>
                {movie.trailer && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-semibold text-foreground hover:bg-white/10"
                  >
                    <Clapperboard className="size-5" /> Trailer
                  </button>
                )}
                <button
                  onClick={() => {
                    const base = siteUrl();
                    shareContent({
                      title: `${movie.title} (${movie.year}) — StreamFlix`,
                      text: movie.description.slice(0, 140),
                      url: base ? `${base}/movie/${movie.id}` : window.location.href,
                    }).then((mode) =>
                      toast.success(mode === "shared" ? "Shared" : "Link copied"),
                    );
                  }}
                  className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground"
                  aria-label="Share"
                >
                  <Share2 className="size-4 sm:size-5" />
                </button>
              </div>
            </div>

            <aside className="space-y-5 rounded-lg border border-border bg-background/70 p-4 backdrop-blur-md sm:p-5 md:col-span-1">
              <div>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  About this title
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
                  <p>
                    <span className="font-medium text-foreground">Genres:</span>{" "}
                    {movie.genres.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Director:</span>{" "}
                    {movie.directorId ? (
                      <Link
                        to="/person/$id"
                        params={{ id: movie.directorId }}
                        className="font-normal text-foreground hover:text-primary hover:underline"
                      >
                        {movie.director}
                      </Link>
                    ) : (
                      movie.director
                    )}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Cast:</span>{" "}
                    {movie.cast.length} actors
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Released:</span> {movie.year}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Runtime:</span> {movie.runtime}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Rating:</span>{" "}
                    <AgeRatingBadge rating={movie.rating} />
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">Cast</p>
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
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
                        className="flex items-center gap-2 transition hover:opacity-80"
                      >
                        <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-border">
                          {movie.castPfp[i] ? (
                            <img
                              src={movie.castPfp[i]}
                              alt={name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                              {name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-foreground">
                            {name}
                          </span>
                          {movie.castRoles?.[i] && (
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {movie.castRoles[i]}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {movie.genreIds.map((gid: number, i: number) => {
                  const label = genreLabels[String(gid)] || movie.genres[i] || "Explore";
                  return (
                    <Link
                      key={`${gid}-${i}`}
                      to="/explore/$genreId"
                      params={{ genreId: String(gid) }}
                      search={{ q: label }}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground transition hover:bg-card hover:border-primary/50"
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              {isTv && movie.numberOfSeasons && movie.numberOfSeasons > 0 && (
                <SeasonEpisodePicker
                  movieId={movie.id}
                  numberOfSeasons={movie.numberOfSeasons}
                />
              )}
            </aside>
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
