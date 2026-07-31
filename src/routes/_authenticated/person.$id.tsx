import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Film, ChevronLeft, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPersonDetails } from "@/lib/api/tmdb";

export const Route = createFileRoute("/_authenticated/person/$id")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `Person — StreamFlix` }] }),
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

const INITIAL_VISIBLE = 4;

function CreditSection({
  title,
  credits,
  countLabel,
}: {
  title: string;
  credits: Credit[];
  countLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? credits : credits.slice(0, INITIAL_VISIBLE);

  if (credits.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          {title}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({credits.length} {countLabel})
          </span>
        </h2>
        {credits.length > INITIAL_VISIBLE && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            {expanded ? "Show less" : `Show all ${credits.length}`}
            <ChevronDown className={`size-3.5 transition ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div
        className={`grid gap-3 ${expanded ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}
      >
        {visible.map((item) => (
          <Link
            key={`${item.id}-${item.character}`}
            to="/movie/$id"
            params={{ id: item.id }}
            className="group relative aspect-video overflow-hidden rounded-lg bg-surface hover:ring-1 hover:ring-primary transition"
          >
            {item.backdrop ? (
              <img
                src={item.backdrop}
                alt={item.title}
                loading="lazy"
                className="size-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid size-full place-items-center text-xs text-muted-foreground p-2 text-center">
                {item.title}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
              <p className="text-xs font-medium text-white truncate">{item.title}</p>
              {item.character && (
                <p className="text-[10px] text-white/60 truncate">{item.character}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PersonPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPersonDetails({ data: { id } })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <main className="px-4 pt-28 pb-16 sm:px-8">
          <div className="mx-auto max-w-6xl animate-pulse space-y-6">
            <div className="mb-4">
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
              <Skeleton className="size-48 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-64 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-20 w-full rounded" />
              </div>
            </div>
          </div>
        </main>
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
          <Link
            to="/search"
            className="inline-block rounded-lg border border-white/60 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
          >
            ← Back to search
          </Link>
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
          <Link
            to="/search"
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-white/60 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
          >
            <ChevronLeft className="size-3.5" /> Back to search
          </Link>

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
                    className={`text-sm text-foreground/80 leading-relaxed ${bioExpanded ? "" : "line-clamp-4"}`}
                  >
                    {data.bio}
                  </p>
                  {data.bio.length > 300 && (
                    <button
                      onClick={() => setBioExpanded((v) => !v)}
                      className="mt-1 text-xs font-medium text-primary"
                    >
                      {bioExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <CreditSection title="Movies" credits={data.movies} countLabel="movies" />
          <CreditSection title="TV Shows" credits={data.tvShows} countLabel="shows" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
