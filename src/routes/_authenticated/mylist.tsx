import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyList, MY_LIST_EVENT, type MyListEntry } from "@/lib/my-list";
import { getMyListFromFirestore } from "@/lib/my-list-firestore";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";

export const Route = createFileRoute("/_authenticated/mylist")({
  head: () => ({ meta: [{ title: "My List — StreamFlix" }] }),
  component: MyListPage,
});

function MyListPage() {
  const [list, setList] = useState<MyListEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      const local = getMyList();
      const merged = new Map<string, MyListEntry>();
      for (const e of local) merged.set(e.id, e);
      try {
        const fs = await getMyListFromFirestore();
        for (const e of fs) {
          const existing = merged.get(e.id);
          if (!existing || e.addedAt > existing.addedAt) merged.set(e.id, e);
        }
      } catch {}
      if (!cancelled) {
        setList(
          Array.from(merged.values()).sort((a, b) => b.addedAt - a.addedAt),
        );
        setLoaded(true);
      }
    };
    update();
    window.addEventListener(MY_LIST_EVENT, update);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      cancelled = true;
      window.removeEventListener(MY_LIST_EVENT, update);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  const kidsMode = isKidsProfile();
  const items = kidsMode ? filterKidsContent(list.map((e) => e.movie)) : list.map((e) => e.movie);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-[1800px] px-4 pt-24 pb-16 sm:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Bookmark className="size-6 fill-current text-primary" /> My List
        </h1>

        {!loaded ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-20 text-center">
            <Bookmark className="mx-auto size-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Your list is empty.</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Tap the bookmark button on any title to save it here.
            </p>
            <Link
              to="/browse"
              className="mt-4 inline-block rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse Movies & Shows
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((m) => (
              <MovieCard key={m.id} movie={m} fluid />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
