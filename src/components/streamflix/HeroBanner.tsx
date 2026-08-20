import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info } from "lucide-react";
import type { Movie } from "@/lib/types";
import { AgeRatingBadge } from "./AgeRatingBadge";

export function HeroBanner({ slides }: { slides: Movie[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (slides.length === 0) return null;
  const s = slides[i];
  if (!s) return null;
  const MAX_DESC_CHARS = 150;
  const description =
    s.description && s.description.length > MAX_DESC_CHARS
      ? `${s.description.slice(0, MAX_DESC_CHARS - 3).trimEnd()}...`
      : s.description;

  return (
    <section className="relative min-h-[40vh] h-[50vh] w-full overflow-hidden sm:min-h-[400px] sm:h-[65vh] lg:min-h-[550px] lg:h-[85vh]">
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
          <div
            key={s.id}
            className="animate-fade-in w-full max-w-none space-y-3 text-center md:max-w-3xl md:text-left"
          >
          <h1 className="text-shadow-hero text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
            {s.title}
          </h1>
          <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-2 text-xs sm:text-sm md:justify-start md:text-sm">
            <span className="text-muted-foreground">{s.year}</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-semibold text-emerald-400">
              {s.score != null ? s.score.toFixed(1) : (s.match ? `${(s.match / 10).toFixed(1)}` : "")}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <AgeRatingBadge rating={s.rating} />
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">{s.runtime}</span>
          </div>
          <p className="hidden md:block mx-auto md:mx-0 text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl">
            {description}
          </p>
          <div className="mx-auto md:mx-0 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Link
              to="/watch/$id"
              params={{ id: s.id }}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:bg-foreground/85 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Play className="size-4 fill-current sm:size-5" /> Play
            </Link>
            <Link
              to="/movie/$id"
              params={{ id: s.id }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-8 bg-gray-600/30 backdrop-blur-sm border-gray-400 text-white hover:bg-gray-600/50 font-semibold px-3 py-2 text-xs rounded-lg transition-all duration-200 sm:h-10 sm:px-6 sm:py-3 sm:text-base lg:h-11 lg:px-8 lg:py-4 lg:text-lg"
            >
              <Info /> More Info
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-[4px] rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-foreground/40"}`}
            aria-label={`Slide ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
