import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/lib/types";
import { MovieCard } from "./MovieCard";

const BASE_CARD_W = 150;
const SM_CARD_W = 190;
const BASE_GAP = 16;
const SM_GAP = 24;
const OVERSCAN = 3;

export function Row({
  title,
  items,
  reasons,
  reasonLinks,
}: {
  title: string;
  items: Movie[];
  reasons?: Record<string, string>;
  reasonLinks?: Record<string, string>;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [isSm, setIsSm] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 640 : false,
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      setViewportW(el.clientWidth);
      setScrollLeft(el.scrollLeft);
      setScrollWidth(el.scrollWidth);
      setIsSm(window.innerWidth >= 640);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const cardW = isSm ? SM_CARD_W : BASE_CARD_W;
  const gap = isSm ? SM_GAP : BASE_GAP;
  const step = cardW + gap;

  const { start, end, padStart, padEnd } = useMemo(() => {
    if (viewportW <= 0) return { start: 0, end: Math.min(items.length, 6), padStart: 0, padEnd: 0 };
    const firstVisible = Math.max(0, Math.floor(scrollLeft / step) - OVERSCAN);
    const lastVisible = Math.min(
      items.length,
      Math.ceil((scrollLeft + viewportW) / step) + OVERSCAN,
    );
    return {
      start: firstVisible,
      end: lastVisible,
      padStart: Math.max(0, firstVisible * step - gap),
      padEnd: Math.max(0, (items.length - lastVisible) * step - gap),
    };
  }, [items.length, scrollLeft, viewportW, step, gap]);

  const visible = items.slice(start, end);

  const canScrollLeft = scrollLeft > 2;
  const canScrollRight = viewportW > 0 && scrollLeft + viewportW < scrollWidth - 2;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = step * Math.max(1, Math.ceil(viewportW / step));
    el.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  return (
    <section className="relative space-y-0 py-0 sm:space-y-0 sm:py-0">
      <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold tracking-tight">
        {title}
      </h2>

      <div className="relative">
        {isSm && canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${title} back`}
            className="absolute left-1 sm:left-2 top-1/2 z-50 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {isSm && canScrollRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${title} forward`}
            className="absolute right-1 sm:right-2 top-1/2 z-50 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
        <div
          ref={scrollerRef}
          className="scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth px-4 sm:px-8 pb-4 sm:pb-10"
        >
          {padStart > 0 && <div aria-hidden style={{ width: padStart }} className="shrink-0" />}
          {visible.map((m) => (
            <MovieCard
              key={m.id + title}
              movie={m}
              reason={reasons?.[m.id]}
              reasonLink={reasonLinks?.[m.id]}
            />
          ))}
          {padEnd > 0 && <div aria-hidden style={{ width: padEnd }} className="shrink-0" />}
        </div>
      </div>
    </section>
  );
}
