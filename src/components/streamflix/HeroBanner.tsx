import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info } from "lucide-react";
import type { Movie } from "@/lib/types";

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
  const description =
    s.description && s.description.length > 220
      ? `${s.description.slice(0, 217).trimEnd()}...`
      : s.description;

  return (
    <section className="relative min-h-[60vh] h-[70vh] w-full overflow-hidden sm:min-h-[520px] sm:h-[85vh] lg:min-h-[620px] lg:h-[92vh]">
      {slides.map((slide, idx) => (
        <img
          key={slide.id}
          src={slide.backdrop}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
            idx === i ? "opacity-100 animate-ken-burns" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent hidden md:block" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent hidden md:block" />

      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-8 pt-10 text-center md:items-end md:justify-start">
        <div
          key={s.id}
          className="animate-fade-in w-full max-w-none space-y-3 text-center md:max-w-3xl md:text-left"
        >
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="inline-block h-px w-6 bg-primary" />
            StreamFlix Original
          </div>
          <h1 className="text-shadow-hero text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            {s.title}
          </h1>
          <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-2 text-xs sm:text-sm md:justify-start md:text-sm">
            <span className="font-semibold text-emerald-400">{s.match}% Match</span>
            <span className="text-muted-foreground">{s.year}</span>
            <span className="rounded border border-border px-2 text-muted-foreground">
              {s.rating}
            </span>
            <span className="text-muted-foreground">{s.runtime}</span>
            <span className="text-muted-foreground">{s.genres.join(" · ")}</span>
          </div>
          <p className="hidden md:block mx-auto md:mx-0 max-w-xl text-sm text-foreground/90 sm:text-base md:text-lg md:leading-7">
            {description}
          </p>
          <div className="mx-auto md:mx-0 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Link
              to="/watch/$id"
              params={{ id: s.id }}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:bg-foreground/85 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Play className="size-4 fill-current sm:size-5" /> Play
            </Link>
            <Link
              to="/movie/$id"
              params={{ id: s.id }}
              className="inline-flex items-center gap-2 rounded-md bg-foreground/20 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-foreground/30 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Info className="size-4 sm:size-5" /> More Info
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
