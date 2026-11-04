import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Film, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton, PersonDetailSkeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { fetchPersonDetails, fetchPersonImages } from "@/lib/api/tmdb";
import { MovieCard } from "@/components/streamflix/MovieCard";
import type { Movie } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/person/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const { fetchPersonDetails } = await import("@/lib/api/tmdb");
    const person = await fetchPersonDetails({ data: { id: params.id } });
    return { personName: person?.name ?? "Person" };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.personName} — StreamFlix` }] }),
  component: PersonPage,
});

type Credit = {
  id: string;
  title: string;
  character: string;
  year: number | null;
  backdrop: string;
  poster: string;
};

type PersonData = {
  id: string;
  name: string;
  photo: string;
  bio: string;
  birthday: string;
  deathday: string;
  birthplace: string;
  department: string;
  movies: Credit[];
  tvShows: Credit[];
};

function CreditSection({
  title,
  credits,
  countLabel,
}: {
  title: string;
  credits: Credit[];
  countLabel: string;
}) {
  if (credits.length === 0) return null;

  return (
    <div className="mb-8">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left rounded-lg border border-border bg-surface text-foreground hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <span className="text-base font-normal text-muted-foreground">
                ({credits.length} {countLabel})
              </span>
            </div>
            <ChevronDown className="size-4 shrink-0" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
            {credits.map((item, idx) => (
              <MovieCard
                key={`${item.id}-${item.character}`}
                movie={{
                  id: item.id,
                  title: item.title,
                  description: item.character ? `As ${item.character}` : "",
                  year: item.year ?? new Date().getFullYear(),
                  releaseDate: undefined,
                  rating: "",
                  runtime: "",
                  runtimeMinutes: 0,
                  genres: [],
                  genreIds: [],
                  poster: item.poster,
                  backdrop: item.backdrop,
                  backdropSm: item.backdrop,
                  trailer: undefined,
                  cast: [],
                  castPfp: [],
                  director: "",
                  directorId: "",
                  match: 0,
                  score: null,
                  popularity: 0,
                  numberOfSeasons: undefined,
                  numberOfEpisodes: undefined,
                  logo: undefined,
                } as Movie}
                landscape
                compact
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PersonPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [data, setData] = useState<PersonData | null>(null);
  const [images, setImages] = useState<Array<{ file_path: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const imagesScrollRef = useRef<HTMLDivElement>(null);

  const goBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/search" });
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPersonDetails({ data: { id } }),
      fetchPersonImages({ data: { id } }),
    ])
      .then(([personData, personImages]) => {
        setData(personData);
        setImages(personImages || []);
      })
      .catch(() => {
        setData(null);
        setImages([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <PersonDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <main className="px-4 pt-28 pb-16 sm:px-8 text-center text-muted-foreground">
          <p>Person not found.</p>
          <button
            type="button"
            onClick={goBack}
            className="inline-block rounded-lg border border-white/60 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
          >
            ← Back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="px-4 pt-28 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-white/60 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
          >
            <ChevronLeft className="size-3.5" /> Back
          </button>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-12">
            {data.photo ? (
              <img
                src={data.photo}
                alt={data.name}
                className="size-48 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="grid size-48 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground">
                <Film className="size-12" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{data.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{data.department}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {data.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> {data.birthday}
                    {data.deathday ? ` — ${data.deathday}` : ""}
                  </span>
                )}
                {data.birthplace && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {data.birthplace}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Film className="size-3.5" /> {data.movies.length} movies, {data.tvShows.length}{" "}
                  TV shows
                </span>
              </div>
              {data.bio && data.bio !== "No biography available." && (
                <div className="mt-4">
                  <p
                    onClick={() => setBioExpanded((v) => !v)}
                    className={`text-sm text-foreground/80 leading-relaxed cursor-pointer md:cursor-default ${bioExpanded ? "" : "line-clamp-4"}`}
                  >
                    {data.bio}
                  </p>
                  {data.bio.length > 300 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setBioExpanded((v) => !v); }}
                      className="mt-1 text-xs font-medium text-primary hidden md:inline"
                    >
                      {bioExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold tracking-tight">Images ({images.length})</h2>
              </div>
              <div className="relative">
                <div
                  ref={imagesScrollRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                      e.preventDefault();
                    }
                  }}
                >
                  {images.map((img, idx) => (
                    <div
                      key={`${img.file_path}-${idx}`}
                      className="flex-shrink-0 aspect-[2/3] w-48 rounded-lg bg-surface overflow-hidden group"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w342${img.file_path}`}
                        alt={`${data?.name} profile ${idx + 1}`}
                        loading="lazy"
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
                {images.length > 5 && (
                  <>
                    <button
                      type="button"
                      onClick={() => imagesScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
                      aria-label="Scroll images left"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imagesScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
                      aria-label="Scroll images right"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <CreditSection title="Movies" credits={data.movies} countLabel="movies" />
          <CreditSection title="TV Shows" credits={data.tvShows} countLabel="shows" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
