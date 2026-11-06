import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  ArrowRight,
  Users,
  Clock,
  Lock,
  Bookmark,
  Home,
  BarChart3,
  Sparkles,
  Crown,
  Shuffle,
  Bell,
  LoaderCircle,
  X,
  Film,
  Tv,
  Layout,
  Calendar,
} from "lucide-react";
import { tmdbFetch, toMovie } from "@/lib/api/tmdb.server";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { auth, db } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { profileHasPin, verifyProfilePin } from "@/lib/profiles";
import { getSelectedProfile, clearSelectedProfile } from "@/lib/selected-profile";
import { clearStreamFlixLocalStorage } from "@/lib/clear-local-storage";
import { suggestTitles, getRandomTitle, searchByPerson } from "@/lib/streamflix-data";
import { useDataSaver } from "@/lib/data-saver";
import { useMobileNavbar } from "@/components/streamflix/mobile-navbar-context";

const links = [
  { label: "Home", to: "/browse", search: { kind: "home" } },
  { label: "Movies", to: "/browse", search: { kind: "movies" } },
  { label: "Shows", to: "/browse", search: { kind: "tv" } },
  { label: "New", to: "/browse", search: { kind: "new" } },
  { label: "Genres", to: "/explore" },
  { label: "Calendar", to: "/calendar" },
  { label: "AI", to: "/assistant" },
] as const;

/** Properly check if a URL is from TMDB images (not a substring match). */
function isTmdbImageUrl(url: string): boolean {
  if (!url || url.startsWith("data:")) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "image.tmdb.org" && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Properly check if a URL is safe to render as an image src. */
function isSafeImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "image.tmdb.org" || parsed.hostname === window.location.hostname)
    );
  } catch {
    return false;
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const u = auth.currentUser;
  const [selectedProfile, setSelectedProfile] = useState<{
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
    kids?: boolean;
  } | null>(null);
  const [userData, setUserData] = useState<{ email: string | null; photoURL: string | null }>({
    email: u?.email ?? null,
    photoURL: u?.photoURL ?? null,
  });
  const [exitKidsOpen, setExitKidsOpen] = useState(false);
  const [exitKidsPin, setExitKidsPin] = useState("");
  const [exitKidsBusy, setExitKidsBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [isVip, setIsVip] = useState(() => {
    try { return localStorage.getItem("sf:vip") === "1"; } catch { return false; }
  });
  const { effectiveSaveData } = useDataSaver();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchKind = useRouterState({
    select: (s) => (s.location.search as { kind?: string } | undefined)?.kind ?? "home",
  });
  const router = useRouter();

  const [searchQ, setSearchQ] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<
    { id: string; title: string; year: number | null; poster: string; mediaType: string; photo?: string }[]
  >([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const { setIsVisible } = useMobileNavbar();

  useEffect(() => {
    // The mobile bottom navbar is hidden on /watch/ pages, so the cookie
    // consent should anchor to the bottom edge there instead of floating.
    setIsVisible(!pathname.startsWith("/watch/"));
  }, [pathname, setIsVisible]);

  const [browseMenuOpen, setBrowseMenuOpen] = useState(false);

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = setTimeout(async () => {
      const [titleRes, peopleRes] = await Promise.all([
        suggestTitles(q),
        searchByPerson(q).catch(() => []),
      ]);
      if (!cancelled) {
        setSearchLoading(false);
        // Combine title and people suggestions, prioritizing titles
        const combined = [
          ...titleRes.slice(0, 5),
          ...peopleRes.slice(0, 3).map((p: any) => ({
            id: `person-${p.id}`,
            title: p.name,
            year: null,
            poster: p.photo || "",
            mediaType: "person",
            photo: p.photo,
          })),
        ];
        setSearchSuggestions(combined);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQ]);

  const submitSearch = (value?: string) => {
    const q = (value ?? searchQ).trim();
    setSearchFocused(false);
    setSearchQ("");
    setSearchSuggestions([]);
    if (!q) return;
    router.navigate({ to: "/search", search: { q } });
  };

  const openSearch = () => {
    if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    setSearchFocused(true);
  };

  const closeSearchSoon = () => {
    if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    searchBlurTimer.current = setTimeout(() => setSearchFocused(false), 150);
  };

  useEffect(
    () => () => {
      if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    },
    [],
  );

  const loadProfile = () => {
    setSelectedProfile(getSelectedProfile());
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener("storage", loadProfile);
    window.addEventListener("profileChanged", loadProfile);
    return () => {
      window.removeEventListener("storage", loadProfile);
      window.removeEventListener("profileChanged", loadProfile);
    };
  }, []);

  useEffect(() => {
    if (!u?.uid) { setIsVip(false); try { localStorage.removeItem("sf:vip"); } catch {} return; }
    getDoc(doc(db, "vip", u.uid)).then((snap) => {
      const v = snap.exists();
      setIsVip(v);
      try { localStorage.setItem("sf:vip", v ? "1" : "0"); } catch {}
    }).catch(() => {});
  }, [u?.uid]);

  useEffect(() => {
    const refreshVip = () => setIsVip(localStorage.getItem("sf:vip") === "1");
    window.addEventListener("sf:vipUpdated", refreshVip);
    return () => window.removeEventListener("sf:vipUpdated", refreshVip);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        window.matchMedia("(max-width: 767px)").matches &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!u) return;
    const unsub = onSnapshot(doc(db, "profiles", u.uid), (snap) => {
      const data = snap.data();
      setUserData({
        email: u.email ?? null,
        photoURL: data?.avatar_url || u.photoURL || null,
      });
    });
    return unsub;
  }, [u]);

  const signOut = async () => {
    if (signOutBusy) return;
    setSignOutBusy(true);
    try {
      const { removePushSubscription } = await import("@/lib/push");
      await removePushSubscription();
    } catch (err) {
      console.warn("Could not remove the push subscription for this device", err);
    }
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch (err) {
      console.warn("Could not clear server session cookie", err);
    }
    await firebaseSignOut(auth);
    clearStreamFlixLocalStorage();
    router.navigate({ to: "/auth", search: { email: "" }, replace: true });
  };

  const handleExitKids = async () => {
    const u = auth.currentUser;
    const profile = selectedProfile;
    setMenuOpen(false);
    if (!u || !profile) return;
    try {
      const hasPin = await profileHasPin(u.uid, profile.id);
      if (hasPin) {
        setExitKidsPin("");
        setExitKidsOpen(true);
      } else {
        clearSelectedProfile();
        router.navigate({ to: "/profiles" });
      }
    } catch {
      clearSelectedProfile();
      router.navigate({ to: "/profiles" });
    }
  };

  const verifyExitKids = async () => {
    const u = auth.currentUser;
    const profile = selectedProfile;
    if (!u || !profile) return;
    setExitKidsBusy(true);
    try {
      const ok = await verifyProfilePin(u.uid, profile.id, exitKidsPin);
      if (ok) {
        setExitKidsOpen(false);
        setExitKidsPin("");
        clearSelectedProfile();
        router.navigate({ to: "/profiles" });
      } else {
        toast.error("Incorrect PIN");
      }
    } catch {
      toast.error("Failed to verify PIN");
    }
    setExitKidsBusy(false);
  };

  const vipRing = isVip ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background" : "";

  const profileAvatar = selectedProfile ? (
    selectedProfile.avatarUrl ? (
      <img
        src={selectedProfile.avatarUrl}
        alt=""
        className={isTmdbImageUrl(selectedProfile.avatarUrl)
          ? `size-7 md:size-8 shrink-0 rounded-lg object-cover ${vipRing}`
          : `size-7 md:size-8 shrink-0 rounded-lg object-contain ${vipRing}`}
        style={isTmdbImageUrl(selectedProfile.avatarUrl) ? {} : { aspectRatio: 'auto' }}
      />
    ) : (
      <div
        className={`grid size-7 md:size-8 place-items-center rounded-lg bg-gradient-to-br ${selectedProfile.color} text-xs font-bold text-white ${vipRing}`}
      >
        {selectedProfile.name[0]?.toUpperCase()}
      </div>
    )
  ) : isSafeImageUrl(userData.photoURL) ? (
    <img
      src={userData.photoURL}
      alt=""
      className={`size-7 md:size-8 shrink-0 rounded-lg object-contain ${vipRing}`}
      style={{ aspectRatio: 'auto' }}
    />
  ) : (
    <div className={`grid size-7 md:size-8 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-red-700 text-xs font-bold text-white ${vipRing}`}>
      {(userData.email || "?")[0]?.toUpperCase()}
    </div>
  );

  return (
    <>
    <header
      className={`${pathname.startsWith("/watch/") ? "hidden" : "fixed inset-x-0 top-0 z-50 wco-aware transition-colors duration-300"} ${
        scrolled
          ? "bg-background/55 backdrop-blur-md"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-12 items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {links.map((l, i) => (
            <Link
              key={i}
              to={l.to} search={l.search} preload={effectiveSaveData ? false : "intent"}
              className={`hover:text-foreground transition-colors ${
                pathname === l.to && (!l.search || (l.search.kind === searchKind)) || (l.to === "/explore" && pathname.startsWith("/explore")) ? "text-foreground font-semibold" : ""
              }`}
            >
              {l.icon && <l.icon className="size-3.5" />}
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                const random = await getRandomTitle();
                if (random?.id) {
                  router.navigate({ to: "/movie/$id", params: { id: random.id } });
                } else {
                  toast.error("Could not fetch random title");
                }
              } catch (e) {
                toast.error("Could not fetch random title");
              }
            }}
            className="inline-flex items-center justify-center h-9 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Random"
          >
            <Shuffle className="size-6" />
          </button>
          {/* Search bar - moved next to profile pic */}
          <div className="relative hidden md:block" ref={searchBoxRef}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => {
                setSearchSuggestions([]);
                setSearchQ(e.target.value);
              }}
              onFocus={openSearch}
              onBlur={closeSearchSoon}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") {
                  setSearchFocused(false);
                  setSearchQ("");
                  setSearchSuggestions([]);
                }
              }}
              placeholder="Search…"
              aria-label="Search"
              className="h-9 w-44 rounded-full border border-border bg-background/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:w-60 focus:border-primary/60 focus:bg-background/70"
            />
            {searchFocused && searchQ.trim().length >= 2 && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur animate-fade-in">
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchLoading ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
                  ) : searchSuggestions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">No results found</li>
                  ) : (
                    searchSuggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchFocused(false);
                            setSearchQ("");
                            setSearchSuggestions([]);
                            if (s.mediaType === "person" || s.id.startsWith("person-")) {
                              router.navigate({ to: "/person/$id", params: { id: s.id.replace("person-", "") } });
                            } else {
                              router.navigate({ to: "/movie/$id", params: { id: s.id } });
                            }
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          {s.poster || s.photo ? (
                            <img src={s.poster || s.photo} alt="" className="size-8 shrink-0 rounded object-cover" />
                          ) : (
                            <span className="grid size-8 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                              {s.mediaType === "person"
                                ? (s.title || "").charAt(0).toUpperCase() || "?"
                                : s.mediaType === "tv"
                                  ? "TV"
                                  : "MOV"}
                            </span>
                          )}
                          <span className="truncate">{s.title}</span>
                          {s.mediaType === "person" && (
                            <span className="ml-1 text-[10px] text-red-400">(person)</span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submitSearch();
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-accent"
                >
                  <Search className="size-4" /> See all results
                </button>
              </div>
            )}
          </div>
          <div className="relative hidden pr-1 sm:pr-0 md:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 group p-1 sm:p-0"
              aria-label="Account menu"
            >
              {profileAvatar}
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {menuOpen && (
              <div
                className="fixed sm:absolute right-4 left-4 sm:left-auto sm:right-0 top-16 sm:top-12 z-50 sm:w-72 overflow-hidden rounded-2xl sm:rounded-xl border border-border bg-card/95 backdrop-blur shadow-2xl animate-fade-in"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  {profileAvatar}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {selectedProfile?.name ?? userData.email ?? "Account"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedProfile?.kids ? "Kids profile" : (userData.email ?? "Signed in")}
                    </p>
                  </div>
                  {isVip && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[10px] font-semibold text-yellow-300">
                      <Crown className="size-3" /> VIP
                    </span>
                  )}
                </div>
                <div className="py-1">
                  {selectedProfile?.kids ? (
                    <button
                      onClick={handleExitKids}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <ArrowRight className="size-4 text-muted-foreground" /> Switch Profile
                    </button>
                  ) : (
                    <Link
                      to="/profiles"
                      preload={false}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent"
                    >
                      <Users className="size-4 text-muted-foreground" /> Switch Profile
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <Settings className="size-4 text-muted-foreground" /> Account & Devices
                  </Link>
                  <Link
                    to="/history"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <Clock className="size-4 text-muted-foreground" /> Watch History
                  </Link>
                  <Link
                    to="/mylist"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <Bookmark className="size-4 text-muted-foreground" /> My List
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const random = await getRandomTitle();
                        if (random?.id) {
                          router.navigate({ to: "/movie/$id", params: { id: random.id } });
                        } else {
                          toast.error("Could not fetch random title");
                        }
                      } catch (e) {
                        toast.error("Could not fetch random title");
                      }
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-accent"
                  >
                    <Shuffle className="size-4 text-muted-foreground" /> Random
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={signOut}
                    disabled={signOutBusy}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signOutBusy ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" /> Signing out…
                      </>
                    ) : (
                      <>
                        <LogOut className="size-4" /> Sign out
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {exitKidsOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-md bg-card p-6 shadow-2xl text-center">
            <Lock className="mx-auto size-10 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-1">Exit Kids Mode</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter the PIN for &quot;{selectedProfile?.name}&quot; to switch to a full profile
            </p>
            <input
              type="password"
              value={exitKidsPin}
              onChange={(e) => setExitKidsPin(e.target.value)}
              maxLength={6}
              autoFocus
              placeholder="Enter PIN"
              className="w-full rounded bg-neutral-800 px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyExitKids();
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setExitKidsOpen(false)}
                className="flex-1 rounded border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={verifyExitKids}
                disabled={exitKidsBusy || !exitKidsPin.trim()}
                className="flex-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {exitKidsBusy ? "Verifying…" : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
    <nav
      ref={mobileNavRef}
      aria-label="Mobile navigation"
      className={`${pathname.startsWith("/watch/") ? "hidden" : "fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 z-50 rounded-2xl border border-white/10 bg-background/60 px-2 pt-1.5 pb-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden"}`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        <Link
          to="/browse"
          search={{ kind: "home" }}
          aria-label="Home"
          className={`flex min-w-14 flex-col items-center gap-1 py-1 text-[10px] ${pathname === "/browse" ? "text-foreground" : "text-muted-foreground"}`}
        >
          <Home className="size-5" /> Home
        </Link>
        <Link
          to="/search"
          aria-label="Search"
          className={`flex min-w-14 flex-col items-center gap-1 py-1 text-[10px] ${pathname === "/search" ? "text-foreground" : "text-muted-foreground"}`}
        >
          <Search className="size-5" /> Search
        </Link>
        <Link
          to="/assistant"
          aria-label="AI"
          className={`flex min-w-14 flex-col items-center gap-1 py-1 text-[10px] ${pathname === "/assistant" ? "text-foreground" : "text-muted-foreground"}`}
        >
          <Sparkles className="size-5" /> AI
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className={`flex min-w-14 flex-col items-center gap-1 py-1 text-[10px] ${menuOpen || pathname === "/settings" ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="relative grid size-7 place-items-center">{profileAvatar}</span>
          Account
        </button>
      </div>
      {menuOpen && (
        <div className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 max-h-[min(28rem,calc(100dvh_-_7rem_-_env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-card/95 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:hidden">
          <div className="flex items-center gap-3 border-b border-border/80 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-4 py-4">
            <div className="shrink-0">{profileAvatar}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedProfile?.name ?? userData.email ?? "Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selectedProfile?.kids ? "Kids profile" : (userData.email ?? "Signed in")}
              </p>
            </div>
            {isVip && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[10px] font-semibold text-yellow-300">
                <Crown className="size-3" /> VIP
              </span>
            )}
          </div>
          <div className="space-y-1 p-2">
            {selectedProfile?.kids ? (
              <button
                type="button"
                onClick={handleExitKids}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowRight className="size-4" /> Switch Profile
              </button>
            ) : (
              <Link
                to="/profiles"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Users className="size-4" /> Switch Profile
              </Link>
            )}
            <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Settings className="size-4" /> Account &amp; Devices</Link>
<Link to="/history" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Clock className="size-4" /> Watch History</Link>
            <Link to="/mylist" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Bookmark className="size-4" /> My List</Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
              disabled={signOutBusy}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signOutBusy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Signing out…
                </>
              ) : (
                <>
                  <LogOut className="size-4" /> Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </nav>
    {browseMenuOpen && (
      <div
        className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
        onClick={() => setBrowseMenuOpen(false)}
      >
        <div
          className="w-[min(24rem,calc(100vw-2rem))] max-h-[min(28rem,calc(100dvh_-_7rem_-_env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-card/95 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-4">
            <h3 className="text-sm font-semibold text-foreground">Browse</h3>
            <button
              onClick={() => setBrowseMenuOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-1 p-2">
            <Link
              to="/browse"
              search={{ kind: "home" }}
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Home className="size-4" /> Browse
            </Link>
            <Link
              to="/browse"
              search={{ kind: "movies" }}
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Film className="size-4" /> Movies
            </Link>
            <Link
              to="/browse"
              search={{ kind: "tv" }}
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Tv className="size-4" /> Shows
            </Link>
            <Link
              to="/browse"
              search={{ kind: "new" }}
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Calendar className="size-4" /> New
            </Link>
            <Link
              to="/explore"
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Layout className="size-4" /> Genres
            </Link>
            <Link
              to="/calendar"
              onClick={() => setBrowseMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Calendar className="size-4" /> Calendar
            </Link>
          </div>
        </div>
      </div>
    )}
  </>
);
}



















