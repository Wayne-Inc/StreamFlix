import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  ArrowRight,
  Users,
  Clock,
  CalendarDays,
  Lock,
  Tv,
  Film,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { auth, db } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { profileHasPin, verifyProfilePin } from "@/lib/profiles";

const links = [
  { kind: "tv", label: "TV Shows" },
  { kind: "movies", label: "Movies" },
  { kind: "new", label: "New & Popular" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchKind = useRouterState({
    select: (s) => (s.location.search as { kind?: string } | undefined)?.kind ?? "home",
  });
  const router = useRouter();

  const loadProfile = () => {
    try {
      const raw = localStorage.getItem("sf:selectedProfile");
      if (raw) {
        const p = JSON.parse(raw);
        setSelectedProfile(p);
      } else {
        setSelectedProfile(null);
      }
    } catch {
      setSelectedProfile(null);
    }
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
    await firebaseSignOut(auth);
    toast.success("Signed out");
    router.navigate({ to: "/auth", replace: true });
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
        router.navigate({ to: "/profiles" });
      }
    } catch {
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
        router.navigate({ to: "/profiles" });
      } else {
        toast.error("Incorrect PIN");
      }
    } catch {
      toast.error("Failed to verify PIN");
    }
    setExitKidsBusy(false);
  };

  const profileAvatar = selectedProfile ? (
    selectedProfile.avatarUrl ? (
      <img
        src={selectedProfile.avatarUrl}
        alt=""
        className="size-9 sm:size-8 shrink-0 aspect-square rounded-lg object-cover"
      />
    ) : (
      <div
        className={`grid size-9 sm:size-8 place-items-center rounded-lg bg-gradient-to-br ${selectedProfile.color} text-xs font-bold text-white`}
      >
        {selectedProfile.name[0]?.toUpperCase()}
      </div>
    )
  ) : userData.photoURL ? (
    <img
      src={userData.photoURL}
      alt=""
      className="size-9 sm:size-8 shrink-0 aspect-square rounded-lg object-cover"
    />
  ) : (
    <div className="grid size-9 sm:size-8 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-red-700 text-xs font-bold text-white">
      {(userData.email || "?")[0]?.toUpperCase()}
    </div>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 items-center gap-6 px-4 sm:px-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {links.map((l, i) => {
            const active = pathname === "/browse" && searchKind === l.kind;
            return (
              <Link
                key={i}
                to="/browse"
                search={{ kind: l.kind }}
                className={`hover:text-foreground transition-colors ${
                  active ? "text-foreground font-semibold" : ""
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/calendar"
            className={`hover:text-foreground transition-colors ${
              pathname === "/calendar" ? "text-foreground font-semibold" : ""
            }`}
          >
            Calendar
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <Link
            to="/search"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Link>
          <div className="relative pr-1 sm:pr-0">
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
                className="fixed sm:absolute right-4 left-4 sm:left-auto sm:right-0 top-16 sm:top-12 z-50 sm:w-72 overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur shadow-2xl animate-fade-in"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  {profileAvatar}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selectedProfile?.name ?? userData.email ?? "Account"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedProfile?.kids
                        ? "Kids profile"
                        : userData.email ?? "Signed in"}
                    </p>
                  </div>
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
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {mobileNavOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur px-4 py-4 animate-fade-in">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Browse
          </p>
          <div className="space-y-1">
            {links.map((l, i) => {
              const active = pathname === "/browse" && searchKind === l.kind;
              const Icon = [Tv, Film, Sparkles][i] ?? Film;
              return (
                <Link
                  key={i}
                  to="/browse"
                  search={{ kind: l.kind }}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" /> {l.label}
                </Link>
              );
            })}
            <Link
              to="/calendar"
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            >
              <CalendarDays className="size-4" /> Calendar
            </Link>
          </div>
        </div>
      )}
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
  );
}
