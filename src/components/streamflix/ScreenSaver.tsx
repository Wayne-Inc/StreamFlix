import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { fetchTrending } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function ScreenSaver() {
  const [active, setActive] = useState(false);
  const [slides, setSlides] = useState<Movie[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isWatching = pathname.startsWith("/watch");

  // Fetch movies for screensaver slideshow
  useEffect(() => {
    fetchTrending()
      .then((data) => {
        if (data && data.length > 0) {
          const filtered = isKidsProfile() ? filterKidsContent(data) : data;
          setSlides(filtered);
        }
      })
      .catch(() => {});
  }, []);

  // Slide rotator when screensaver is active
  useEffect(() => {
    if (!active || slides.length === 0) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 10000);
    return () => clearInterval(t);
  }, [active, slides.length]);

  // Inactivity timer
  useEffect(() => {
    if (isWatching) {
      setActive(false);
      return;
    }

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setActive(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!window.location.pathname.startsWith("/watch")) {
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

  if (!active || slides.length === 0) return null;

  const currentMovie = slides[slideIndex] || slides[0];
  if (!currentMovie) return null;

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

      {/* Dark gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80" />

      {/* StreamFlix brand watermark top-left */}
      <div className="absolute top-8 left-8 text-white/50 text-xl font-bold tracking-widest uppercase">
        StreamFlix
      </div>

      {/* Title at bottom left, genres below with dots */}
      <div className="absolute bottom-12 left-12 z-10 text-left max-w-2xl space-y-2">
        <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight drop-shadow-lg">
          {currentMovie.title}
        </h1>
        {currentMovie.genres && currentMovie.genres.length > 0 && (
          <p className="text-sm sm:text-base font-normal text-white/80 tracking-wide">
            {currentMovie.genres.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
