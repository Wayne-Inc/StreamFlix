import { useEffect, useState, useCallback } from "react";
import { Search, X, User as UserIcon, Star, Film } from "lucide-react";
import { toast } from "sonner";
import { fetchPopularPeople } from "@/lib/api/tmdb";
import { getWatchHistory } from "@/lib/continue-watching";

interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

interface WatchedCharacter {
  name: string;
  profile_path: string | null;
  title: string;
  mediaType: "movie" | "tv";
}

export function TmdbAvatarPicker({
  onSelect,
  onClose,
}: {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<TmdbPerson[]>([]);
  const [watchedCharacters, setWatchedCharacters] = useState<WatchedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbPerson[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"watched" | "popular" | "search">("watched");

  const imageBaseUrl = "https://image.tmdb.org/t/p/w185";

  // Load characters from watch history
  useEffect(() => {
    const history = getWatchHistory();
    const characters: WatchedCharacter[] = [];

    for (const item of history) {
      // Use cast (actors) and castPfp (actor profile pictures) from watch history
      // Note: character names (castRoles) are not stored in watch history, so we use actor names
      const cast = item.cast || [];
      const castPfp = item.castPfp || [];

      for (let i = 0; i < cast.length; i++) {
        const actorName = cast[i];
        const profilePath = castPfp[i] ? castPfp[i].replace("https://image.tmdb.org/t/p/w185", "") : null;

        if (actorName && profilePath) {
          characters.push({
            name: actorName,
            profile_path: profilePath,
            title: item.title,
            mediaType: item.id.startsWith("tv-") ? "tv" : "movie",
          });
        }
      }
    }

    // Remove duplicates by name, keep first occurrence
    const uniqueCharacters = characters.filter(
      (char, index, self) => index === self.findIndex((c) => c.name === char.name)
    ).slice(0, 20); // Limit to 20 characters

    setWatchedCharacters(uniqueCharacters);
  }, []);

  const loadPopular = useCallback(async (pageNum = 1) => {
    try {
      const data = await fetchPopularPeople({ data: { page: pageNum } });
      const results = (data.results || []).filter((p: TmdbPerson) => p.profile_path);
      if (pageNum === 1) {
        setPeople(results);
      } else {
        setPeople((prev) => [...prev, ...results]);
      }
      setHasMore(data.page < data.total_pages);
    } catch (err) {
      console.error("Failed to fetch popular people:", err);
      toast.error("Failed to load avatars");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Use TMDB search person endpoint
      const res = await fetch(
        `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY || import.meta.env.VITE_TMDB_V3_API_KEY || ""}`,
            accept: "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults((data.results || []).filter((p: TmdbPerson) => p.profile_path));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopular(1);
  }, [loadPopular]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  const handleSelect = (person: TmdbPerson | WatchedCharacter) => {
    if (person.profile_path) {
      onSelect(`${imageBaseUrl}${person.profile_path}`);
    }
  };

  const displayPeople = searchQuery
    ? searchResults
    : activeTab === "watched"
      ? watchedCharacters
      : people;

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actors, characters..."
            className="w-full rounded bg-neutral-800 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded bg-neutral-800 text-muted-foreground hover:text-foreground hover:bg-neutral-700"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {!searchQuery && (
        <div className="mb-4 flex gap-1 bg-neutral-800/50 rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "watched"}
            onClick={() => setActiveTab("watched")}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition ${
              activeTab === "watched"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="size-3.5 inline mr-1" /> Your Characters
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "popular"}
            onClick={() => setActiveTab("popular")}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition ${
              activeTab === "popular"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="size-3.5 inline mr-1" /> Popular Actors
          </button>
        </div>
      )}

      {loading && activeTab === "popular" && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Loading avatars...
        </div>
      )}

      {(!loading || activeTab === "watched" || searchQuery) && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {displayPeople.map((person, index) => (
            <button
              key={`${activeTab}-${person.name}-${index}`}
              onClick={() => handleSelect(person as any)}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800/50 hover:ring-2 hover:ring-primary transition"
              aria-label={person.name}
            >
              {person.profile_path ? (
                <img
                  src={`${imageBaseUrl}${person.profile_path}`}
                  alt={person.name}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <UserIcon className="size-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition p-2 flex flex-col items-end justify-end">
                <span className="text-xs text-white truncate w-full">{person.name}</span>
                {activeTab === "watched" && 'title' in person && (
                  <span className="text-[10px] text-white/70 truncate w-full">{person.title}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && activeTab === "popular" && !searchQuery && hasMore && (
        <button
          onClick={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            loadPopular(nextPage);
          }}
          disabled={loading}
          className="mt-4 w-full rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Load more
        </button>
      )}

      {searchQuery && searchResults.length === 0 && !searchLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <UserIcon className="mx-auto size-12 mb-2 opacity-50" />
          <p>No results found for "{searchQuery}"</p>
        </div>
      )}

      {!searchQuery && watchedCharacters.length === 0 && activeTab === "watched" && (
        <div className="text-center py-8 text-muted-foreground">
          <Film className="mx-auto size-12 mb-2 opacity-50" />
          <p>Watch some movies or shows to see characters here</p>
        </div>
      )}
    </div>
  );
}