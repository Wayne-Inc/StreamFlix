import type { Movie } from "@/lib/types";
import { MovieCard } from "./MovieCard";

export function Row({ title, items }: { title: string; items: Movie[] }) {
  return (
    <section className="relative space-y-0.5 py-0.5 sm:space-y-4 sm:py-6">
      <h2 className="px-4 sm:px-8 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>

      <div className="scrollbar-hide flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth px-4 sm:px-8 pb-4 sm:pb-10">
        {items.map((m) => (
          <MovieCard key={m.id + title} movie={m} />
        ))}
      </div>
    </section>
  );
}
