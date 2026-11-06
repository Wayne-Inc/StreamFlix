import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Film, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { PersonDetailPageSkeleton } from "@/components/ui/skeleton-pages";
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

// How many credits to show by default (one horizontal row's worth).
const CREDITS_DEFAULT_SHOW = 4;

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
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? credits : credits.slice(0, CREDITS_DEFAULT_SHOW);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <span className="text-base font-normal text-muted-foreground">
            ({credits.length} {countLabel})
          </span>
        </div>
        {credits.length > CREDITS_DEFAULT_SHOW && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
          >
            {showAll ? (
              <>
                Show less
                <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                Show all ({credits.length})
                <ChevronDown className="size-4" />
              </>
            )}
          </button>
        )}
      </div>
      {/* Responsive grid of credits so they fit within device boundaries in rows & columns.
           Mobile: 2 cards per row (2 rows for the default 4). Desktop: 4 cards in one row. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {visible.map((item, idx) => (
          <MovieCard
            key={`${item.id}-${item.character}`}
            movie={{
              id: item.id,
              title: item.title,
              description: "",
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
            fluid
            landscape
            size="sm"
            character={item.character}
          />
        ))}
      </div>
    </div>
  );
}

function PersonPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [data, setData] = useState<PersonData | null>(null);
  const [images, setImages] = useState<Array<{ file_path: string }>>([]);
  const [imagesShowAll, setImagesShowAll] = useState(false);
  // Default view shows as many images as fit in the first row of the Show-All grid:
  // 2 on mobile, 3 on sm, 4 on lg, 5 on xl
  const [defaultImagesCount, setDefaultImagesCount] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setDefaultImagesCount(w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 640 ? 3 : 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const imagesVisible = imagesShowAll ? images : images.slice(0, defaultImagesCount);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

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
      <div className="min-h-dvh bg-background pb-20 md:pb-0">
        <Navbar />
        <PersonDetailPageSkeleton />
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-background pb-20 md:pb-0">
        <Navbar />
        <main className="px-4 pt-28 pb-16 sm:px-8 text-center text-muted-foreground">
          <p>Person not found.</p>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-lg transition hover:bg-white/20"
          >
            ← Back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="px-4 pt-28 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-lg transition hover:bg-white/20"
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
                {images.length > defaultImagesCount && (
                  <button
                    type="button"
                    onClick={() => setImagesShowAll((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
                  >
                    {imagesShowAll ? (
                      <>
                        Show less
                        <ChevronUp className="size-4" />
                      </>
                    ) : (
                      <>
                        Show all ({images.length})
                        <ChevronDown className="size-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
              {imagesShowAll ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {imagesVisible.map((img, idx) => (
                    <div
                      key={`${img.file_path}-${idx}`}
                      className="aspect-[2/3] w-full shrink-0 rounded-lg bg-surface overflow-hidden group"
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
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {imagesVisible.map((img, idx) => (
                    <div
                      key={`${img.file_path}-${idx}`}
                      className="aspect-[2/3] w-full shrink-0 rounded-lg bg-surface overflow-hidden group"
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
              )}
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
