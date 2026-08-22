import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { fetchTrending, fetchTitleLogos } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";
import { buildTitleLogoUrl } from "@/lib/title-logo";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function ScreenSaver() {
  const [active, setActive] = useState(false);
  const [slides, setSlides] = useState<Movie[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [logoMap, setLogoMap] = useState<Record<string, string | null>>({});
  const dataLoadedRef = useRef(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isWatching = pathname.startsWith("/watch");

  // Fetch movies only when screensaver first activates
  const loadSlides = async () => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    try {
      const data = await fetchTrending();
      if (data && data.length > 0) {
        const filtered = isKidsProfile() ? filterKidsContent(data) : data;
        setSlides(filtered);
        const map = await fetchTitleLogos({ data: { ids: filtered.map((m: Movie) => m.id) } }).catch(() => ({}));
        setLogoMap(map);
      }
    } catch {}
  };

  // Slide rotator when screensaver is active
  useEffect(() => {
    if (!active || slides.length === 0) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 10000);
    return () => clearInterval(t);
  }, [active, slides.length]);

  // Disable screensaver on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  // Inactivity timer — no router state subscription when inactive
  useEffect(() => {
    if (isWatching || isMobile) {
      setActive(false);
      return;
    }

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setActive(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!window.location.pathname.startsWith("/watch")) {
          loadSlides();
          setActive(true);
        }
      }, INACTIVITY_TIMEOUT);
    };

    resetTimer();

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    return () => {
      clearTimeout(timeout);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isWatching]);

  if (!active || slides.length === 0 || isMobile) return null;

  const currentMovie = slides[slideIndex] || slides[0];
  if (!currentMovie) return null;

  const titleLogo = logoMap[currentMovie.id];

  return (
    <div
      onClick={() => setActive(false)}
      className="fixed inset-0 z-50 bg-black overflow-hidden animate-fade-in cursor-pointer"
      aria-label="Screensaver"
    >
      {slides.map((slide, idx) => (
        <img
          key={slide.id}
          src={slide.backdrop || slide.poster}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
            idx === slideIndex ? "opacity-100 animate-ken-burns" : "opacity-0"
          }`}
        />
      ))}

      {/* Soft gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/35" />

      {/* StreamFlix brand watermark top-left */}
      <div className="absolute top-8 left-8 text-white/50 text-xl font-bold tracking-widest uppercase">
        StreamFlix
      </div>

      {/* Title at bottom left, genres below with dots */}
      <div className="absolute bottom-12 left-12 z-10 text-left max-w-2xl space-y-2">
        {titleLogo ? (
          <img
            src={buildTitleLogoUrl(titleLogo, 900)}
            alt={currentMovie.title}
            draggable={false}
            className="max-h-24 w-auto max-w-full object-contain drop-shadow-lg select-none sm:max-h-32 md:max-h-40"
          />
        ) : (
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight drop-shadow-lg">
            {currentMovie.title}
          </h1>
        )}
        {currentMovie.genres && currentMovie.genres.length > 0 && (
          <p className="text-sm sm:text-base font-normal text-white/80 tracking-wide">
            {currentMovie.genres.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
