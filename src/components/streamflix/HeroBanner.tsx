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
    <section
      className="relative w-full overflow-hidden aspect-[16/9] max-h-[90vh] min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]"
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
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />

      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-8 pt-10 text-center sm:px-8 md:items-end md:justify-start">
          {/* Bottom gradient for text contrast */}
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background/95 via-background/40 to-transparent z-0 pointer-events-none" />
          
          <div
            key={s.id}
            className="animate-fade-in w-full max-w-none space-y-3 text-center md:max-w-3xl md:text-left"
          >
            {titleLogoUrl ? (
              <img
                src={titleLogoUrl}
                alt={s.title}
                draggable={false}
                className="mb-4 mx-auto md:mx-0 max-h-28 w-auto max-w-full object-contain select-none sm:max-h-32 md:max-h-36"
              />
            ) : (
              <h1 className="mb-4 text-3xl md:text-3xl lg:text-4xl font-bold">{s.title}</h1>
            )}
            {s.genreIds.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-base font-normal text-white/80 tracking-wide">
                {s.genreIds.map((gid, idx) => (
                  <span key={gid} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-white/40">·</span>}
                    {genreLabels[String(gid)] || s.genres[idx] || "Explore"}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:justify-start md:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg">
                <Calendar className="size-3.5" /> {s.year}
              </span>
              <AgeRatingBadge
                rating={s.rating}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg"
              />
              {(s.runtime || s.runtimeMinutes) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg">
                  <Clock className="size-3.5" /> {s.runtime || (s.runtimeMinutes ? `${Math.floor(s.runtimeMinutes / 60)}h ${s.runtimeMinutes % 60}m` : '')}
                </span>
              )}
            </div>
            <p className="hidden md:block mx-auto md:mx-0 text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl">
              {description}
            </p>
            <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
              <Link
                to="/watch/$id"
                params={{ id: s.id }}
                className="inline-flex w-full sm:w-auto max-w-[90%] sm:max-w-none items-center justify-center gap-2 rounded-md bg-foreground px-4 py-3 text-base font-bold text-background transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:bg-foreground/85 sm:px-6 sm:py-3.5 sm:text-base"
              >
                <Play className="size-4 fill-current sm:size-5" /> Play
              </Link>
              <Link
                to="/movie/$id"
                params={{ id: s.id }}
                className="inline-flex w-full sm:w-auto max-w-[92%] sm:max-w-none items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-11 bg-gray-600/30 backdrop-blur-xl border-gray-400 text-white hover:bg-gray-600/50 font-bold px-4 py-3 text-base rounded-lg transition-all duration-200 sm:h-11 sm:px-8 sm:py-4 sm:text-base lg:h-12 lg:px-10 lg:py-5 lg:text-lg"
              >
                <Info /> More Info
              </Link>
            </div>
          </div>
        </div>

      <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`transition-all ${idx === i ? "w-8 h-2 rounded-full bg-primary" : "w-2 h-2 rounded-full bg-foreground/40 hover:w-4 hover:bg-foreground/60"}`}
            aria-label={`Slide ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}