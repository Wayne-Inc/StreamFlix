import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Calendar, Clock } from "lucide-react";
import type { Movie } from "@/lib/types";
import { AgeRatingBadge } from "./AgeRatingBadge";
import { buildTitleLogoUrl } from "@/lib/title-logo";

export function HeroBanner({ slides }: { slides: Movie[] }) {
  const [i, setI] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = useCallback((dir: -1 | 1) => {
    setI((v) => (v + dir + slides.length) % slides.length);
  }, [slides.length]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    const threshold = 50;
    if (touchDelta.current > threshold) go(-1);
    else if (touchDelta.current < -threshold) go(1);
    touchStart.current = null;
    touchDelta.current = 0;
  }, [go]);

  const genreLabels: Record<string, string> = {
    "28": "Action",
    "12": "Adventure",
    "16": "Animation",
    "35": "Comedy",
    "80": "Crime",
    "99": "Documentary",
    "18": "Drama",
    "10751": "Family",
    "14": "Fantasy",
    "36": "History",
    "27": "Horror",
    "10402": "Music",
    "9648": "Mystery",
    "10749": "Romance",
    "878": "Sci-Fi",
    "10752": "War",
    "37": "Western",
    "53": "Thriller",
  };

  if (slides.length === 0) return null;
  const s = slides[i];
  if (!s) return null;
  const MAX_DESC_CHARS = 150;
  const description =
    s.description && s.description.length > MAX_DESC_CHARS
      ? `${s.description.slice(0, MAX_DESC_CHARS - 3).trimEnd()}...`
      : s.description;

  const titleLogoUrl = s.logo?.filePath ? buildTitleLogoUrl(s.logo.filePath) : null;

  return (
    <>
      {/* Hero Image Section - Full 16:9 backdrop */}
      <section
        className="relative w-full overflow-hidden aspect-[16/9] max-h-[95vh] min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, idx) => {
          const near = Math.abs(idx - i) <= 1;
          return (
            <img
              key={slide.id}
              src={near ? slide.backdrop : undefined}
              alt=""
              loading={idx === i ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === i ? "high" : "low"}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
                idx === i ? "opacity-100 animate-ken-burns" : "opacity-0"
              }`}
            />
          );
        })}
        {/* Subtle gradient only at bottom for slide indicators visibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

        {/* Slide indicators - positioned over image on both mobile and desktop */}
        <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`transition-all ${idx === i ? "w-8 h-2 rounded-full bg-primary" : "w-2 h-2 rounded-full bg-foreground/50 hover:w-4 hover:bg-foreground/70"}`}
              aria-label={`Slide ${idx + 1}`}
              type="button"
            />
          ))}
        </div>
      </section>

      {/* Movie Info & Actions Section - Below hero on mobile, overlay on desktop */}
      <section className="relative -mt-px z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-8 md:py-10 lg:py-14">
          <div key={s.id} className="animate-fade-in space-y-4 text-center sm:text-left">
            {titleLogoUrl ? (
              <img
                src={titleLogoUrl}
                alt={s.title}
                draggable={false}
                className="mx-auto mb-4 max-h-24 w-auto max-w-full object-contain select-none sm:max-h-28 md:max-h-32 lg:max-h-36"
              />
            ) : (
              <h1 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">{s.title}</h1>
            )}
            {s.genreIds.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground sm:justify-start">
                {s.genreIds.map((gid, idx) => (
                  <span key={gid} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-muted-foreground/50">·</span>}
                    {genreLabels[String(gid)] || s.genres[idx] || "Explore"}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground backdrop-blur-lg">
                <Calendar className="size-3.5" /> {s.year}
              </span>
              <AgeRatingBadge
                rating={s.rating}
                className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground backdrop-blur-lg"
              />
              {(s.runtime || s.runtimeMinutes) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground backdrop-blur-lg">
                  <Clock className="size-3.5" /> {s.runtime || (s.runtimeMinutes ? `${Math.floor(s.runtimeMinutes / 60)}h ${s.runtimeMinutes % 60}m` : '')}
                </span>
              )}
            </div>
            <p className="mx-auto max-w-3xl text-base text-muted-foreground leading-relaxed sm:text-lg">
              {description}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Link
                to="/watch/$id"
                params={{ id: s.id }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                <Play className="size-4 fill-current sm:size-5" /> Play
              </Link>
              <Link
                to="/movie/$id"
                params={{ id: s.id }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card/50 px-6 py-3.5 text-base font-bold text-foreground backdrop-blur-lg transition-all duration-200 hover:bg-accent hover:border-primary/50"
              >
                <Info className="size-4" /> More Info
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}