import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Pencil,
  Plus,
  Trash2,
  X,
  Lock,
  Upload,
  Github,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/streamflix/Logo";
import { AvatarCropModal } from "@/components/streamflix/AvatarCropModal";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase";
import { getWatchHistory } from "@/lib/continue-watching";
import {
  createProfile,
  deleteProfile,
  ensureUserHasProfile,
  getUserProfiles,
  updateProfile,
  setProfilePin,
  removeProfilePin,
  verifyProfilePin,
  type Profile,
} from "@/lib/profiles";
import { getFavoriteGenres, setFavoriteGenres, GENRE_OPTIONS } from "@/lib/favorite-genres";
import { isKidsProfile } from "@/lib/kids-mode";

function isValidAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/_authenticated/profiles")({
  beforeLoad: () => {
    if (isKidsProfile()) {
      throw redirect({ to: "/browse" });
    }
  },
  head: () => ({ meta: [{ title: "Who's watching? — StreamFlix" }] }),
  component: ProfilesPage,
});

const COLORS = [
  "from-rose-500 to-red-700",
  "from-sky-500 to-indigo-700",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-violet-500 to-purple-700",
  "from-pink-500 to-rose-700",
  "from-cyan-500 to-blue-700",
  "from-lime-400 to-green-600",
];

function defaultName() {
  const u = auth.currentUser;
  return (u?.displayName?.trim() || u?.email?.split("@")[0] || "Profile") as string;
}

function ProfilesPage() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [editTarget, setEditTarget] = useState<Profile | "new" | null>(null);
  const [pinTarget, setPinTarget] = useState<Profile | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [pickedGenres, setPickedGenres] = useState<number[]>([]);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [bgSlides, setBgSlides] = useState<string[]>([]);
  const [bgIdx, setBgIdx] = useState(0);
  const [showGithubPrompt, setShowGithubPrompt] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sf:github_prompt") === "1") {
        setShowGithubPrompt(true);
        localStorage.removeItem("sf:github_prompt");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem("sf:onboarded")) return;
        const genres = await getFavoriteGenres(u.uid);
        if (!cancelled && genres.length === 0) setOnboardOpen(true);
      } catch {
        /* skip onboarding if lookup fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const history = getWatchHistory().slice(0, 8);
    const backdrops = history.map((h) => h.backdrop).filter(Boolean);
    if (backdrops.length === 0) {
      setBgSlides(["https://image.tmdb.org/t/p/original/wwemzKWzjKYJFfCeiB57q3r4Bcm.svg"]);
      return;
    }
    setBgSlides(backdrops);
  }, []);

  useEffect(() => {
    if (bgSlides.length < 2) return;
    const t = setInterval(() => setBgIdx((v) => (v + 1) % bgSlides.length), 6000);
    return () => clearInterval(t);
  }, [bgSlides.length]);

  const load = async () => {
    const u = auth.currentUser;
    if (!u) return;
    try {
      const list = await ensureUserHasProfile(u.uid, defaultName());
      setProfiles(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't load profiles");
      setProfiles([]);
    }
  };

  useEffect(() => {
    load();
    // load reads auth.currentUser (stable); mount-only is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = async (p: Profile) => {
    if (!editing) {
      const u = auth.currentUser;
      if (u && p.hasPin) {
        setPinTarget(p);
        setPinValue("");
        return;
      }
    }
    selectProfile(p);
  };

  const selectProfile = (p: Profile) => {
    try {
      localStorage.setItem(
        "sf:selectedProfile",
        JSON.stringify({
          id: p.id,
          name: p.name,
          color: p.color,
          avatarUrl: p.avatarUrl,
          kids: p.kids,
        }),
      );
      window.dispatchEvent(new Event("profileChanged"));
    } catch {}
    navigate({ to: "/browse" });
  };

  const verifyPinAndSelect = async () => {
    const u = auth.currentUser;
    if (!u || !pinTarget) return;
    setPinBusy(true);
    try {
      const ok = await verifyProfilePin(u.uid, pinTarget.id, pinValue);
      if (ok) {
        selectProfile(pinTarget);
        setPinTarget(null);
        setPinValue("");
      } else {
        toast.error("Incorrect PIN");
      }
    } catch {
      toast.error("Failed to verify PIN");
    }
    setPinBusy(false);
  };

  const skipOnboard = () => {
    try {
      localStorage.setItem("sf:onboarded", "1");
    } catch {}
    setOnboardOpen(false);
  };

  const saveOnboard = async () => {
    const u = auth.currentUser;
    if (!u) return;
    if (pickedGenres.length === 0) {
      toast.error("Pick at least one genre");
      return;
    }
    setOnboardBusy(true);
    try {
      await setFavoriteGenres(u.uid, pickedGenres);
      try {
        localStorage.setItem("sf:onboarded", "1");
      } catch {}
      setOnboardOpen(false);
      toast.success("Preferences saved");
    } catch {
      toast.error("Couldn't save preferences");
    }
    setOnboardBusy(false);
  };

  const toggleGenre = (id: number) => {
    setPickedGenres((cur) => {
      if (cur.includes(id)) return cur.filter((g) => g !== id);
      if (cur.length >= 5) {
        toast.error("You can pick up to 5 genres");
        return cur;
      }
      return [...cur, id];
    });
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background">
      {bgSlides.length > 0 && (
        <div className="absolute inset-0">
          {bgSlides.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt=""
              className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${idx === bgIdx ? "opacity-40" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </div>
      )}
      <header className="absolute inset-x-0 top-0 px-4 sm:px-12 py-5 z-10">
        <Logo />
      </header>
      <div className="relative z-20 w-full max-w-4xl px-4 text-center">
        <h1 className="text-3xl font-medium sm:text-5xl">
          {editing ? "Manage Profiles:" : "Who's watching?"}
        </h1>

        {profiles === null ? (
          <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="size-28 sm:size-32 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-8">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => (editing ? setEditTarget(p) : choose(p))}
                  className="group flex flex-col items-center gap-3"
                >
                  <div
                    className={`relative size-28 overflow-hidden rounded-lg transition-all group-hover:ring-4 group-hover:ring-foreground sm:size-32 ${p.avatarUrl ? "" : `bg-gradient-to-br ${p.color}`}`}
                  >
                    {p.avatarUrl && isValidAvatarUrl(p.avatarUrl) ? (
                      <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-2xl font-black text-white/90 sm:text-5xl">
                        {p.name[0]?.toUpperCase()}
                      </span>
                    )}
                    {p.hasPin && !editing && (
                      <span
                        className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-full bg-black/70 text-foreground ring-1 ring-border sm:size-6"
                        title="Locked profile"
                      >
                        <Lock className="size-3 sm:size-3.5" />
                      </span>
                    )}
                    {editing && (
                      <div className="absolute inset-0 grid place-items-center bg-black/60">
                        <Pencil className="size-7 text-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                    {p.name}{" "}
                    {p.kids && (
                      <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        Kids
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {profiles.length < 5 && (
              <li>
                <button
                  onClick={() => setEditTarget("new")}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="grid size-28 place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors group-hover:border-foreground group-hover:text-foreground sm:size-32">
                    <Plus className="size-8 sm:size-10" />
                  </div>
                  <span className="text-muted-foreground">Add Profile</span>
                </button>
              </li>
            )}
          </ul>
        )}

        <button
          onClick={() => setEditing((v) => !v)}
          className="mt-8 rounded border border-border px-6 py-2 text-sm tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground uppercase sm:mt-12"
        >
          {editing ? "Done" : "Manage Profiles"}
        </button>
      </div>

      {editTarget && (
        <ProfileEditor
          target={editTarget}
          existingCount={profiles?.length ?? 0}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null);
            await load();
          }}
        />
      )}

      {pinTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-md bg-card p-6 shadow-2xl text-center">
            <Lock className="mx-auto size-10 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-1">Enter PIN for non-kids profile</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter PIN for &quot;{pinTarget.name}&quot;
            </p>
            <input
              type="password"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              maxLength={6}
              autoFocus
              placeholder="Enter PIN"
              aria-label="Enter PIN"
              className="w-full rounded bg-neutral-800 px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyPinAndSelect();
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPinTarget(null);
                  setPinValue("");
                }}
                className="flex-1 rounded border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={verifyPinAndSelect}
                disabled={pinBusy || !pinValue.trim()}
                className="flex-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {pinBusy ? "Verifying…" : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {onboardOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/90 p-4">
          <div className="w-full max-w-xl rounded-md bg-card p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-semibold">What do you like to watch?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick up to 5 genres and we'll personalize your recommendations.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => {
                const selected = pickedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-foreground hover:border-primary/60"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{pickedGenres.length}/5 picked</p>
              <div className="flex gap-2">
                <button
                  onClick={skipOnboard}
                  className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  Skip
                </button>
                <button
                  onClick={saveOnboard}
                  disabled={onboardBusy || pickedGenres.length === 0}
                  className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {onboardBusy ? "Saving…" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGithubPrompt && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-2xl sm:p-8 text-center">
            <Github className="mx-auto size-12 text-foreground mb-4" />
            <h2 className="text-xl font-semibold">Join our GitHub community</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              StreamFlix is open source! Join our GitHub organisation to contribute, report bugs, and help shape the project.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="https://github.com/Wayne-Inc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowGithubPrompt(false)}
                className="rounded bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Join Wayne-Inc on GitHub
              </a>
              <button
                onClick={() => setShowGithubPrompt(false)}
                className="rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProfileEditor({
  target,
  existingCount,
  onClose,
  onSaved,
}: {
  target: Profile | "new";
  existingCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = target === "new";
  const existing = isNew ? null : (target as Profile);
  const [name, setName] = useState(existing?.name ?? "");
  const [kids, setKids] = useState(existing?.kids ?? false);
  const [color, setColor] = useState(existing?.color ?? COLORS[existingCount % COLORS.length]);
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatarUrl ?? "");
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState(existing?.hasPin ?? false);
  const [removePinOpen, setRemovePinOpen] = useState(false);
  const [removePinValue, setRemovePinValue] = useState("");
  const [removePinBusy, setRemovePinBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFilePicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    const u = auth.currentUser;
    if (!u) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        await createProfile(u.uid, {
          name: name.trim(),
          kids,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        const list = await getUserProfiles(u.uid);
        const created = list.find((p) => p.name === name.trim());
        if (created) {
          await updateProfile(u.uid, created.id, { color, avatarUrl: avatarUrl.trim() || "" });
          if (pin.trim()) {
            await setProfilePin(u.uid, created.id, pin.trim());
            setHasPin(true);
          }
        }
        toast.success("Profile added");
      } else if (existing) {
        await updateProfile(u.uid, existing.id, {
          name: name.trim(),
          kids,
          color,
          avatarUrl: avatarUrl.trim() || "",
        });
        if (pin.trim()) {
          await setProfilePin(u.uid, existing.id, pin.trim());
          setHasPin(true);
        }
        toast.success("Profile updated");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save profile");
    } finally {
      setBusy(false);
    }
  };

  const removePin = async () => {
    if (!existing) return;
    const u = auth.currentUser;
    if (!u) return;
    setRemovePinBusy(true);
    try {
      const ok = await verifyProfilePin(u.uid, existing.id, removePinValue);
      if (!ok) {
        toast.error("Incorrect PIN");
        setRemovePinBusy(false);
        return;
      }
      await removeProfilePin(u.uid, existing.id);
      setHasPin(false);
      setPin("");
      setRemovePinOpen(false);
      setRemovePinValue("");
      toast.success("PIN removed");
    } catch {
      toast.error("Couldn't remove PIN");
    }
    setRemovePinBusy(false);
  };

  const remove = async () => {
    if (!existing) return;
    const u = auth.currentUser;
    if (!u) return;
    if (existingCount <= 1) {
      toast.error("You must keep at least one profile");
      return;
    }
    if (!confirm(`Delete profile "${existing.name}"?`)) return;
    setBusy(true);
    try {
      await deleteProfile(u.uid, existing.id);
      toast.success("Profile deleted");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't delete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-md bg-card p-4 shadow-2xl max-h-[92dvh] overflow-y-auto sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{isNew ? "Add Profile" : "Edit Profile"}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
          {avatarUrl && isValidAvatarUrl(avatarUrl) ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-20 rounded-lg object-cover ring-2 ring-border"
            />
          ) : avatarUrl && !isValidAvatarUrl(avatarUrl) ? (
            <div className="text-xs text-destructive mb-2">
              Invalid URL — must start with http:// or https://
            </div>
          ) : (
            <div
              className={`grid size-20 place-items-center rounded-lg bg-gradient-to-br ${color} text-3xl font-black text-white/90`}
            >
              {(name || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 w-full space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              aria-label="Profile name"
              className="w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Avatar URL (optional)"
                aria-label="Avatar URL"
                className="min-w-0 flex-1 rounded bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded bg-neutral-700 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-600"
              >
                <Upload className="size-3.5" /> Upload
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFilePicked(e.target.files?.[0])}
            />
          </div>
        </div>

        {cropSrc && (
          <AvatarCropModal
            src={cropSrc}
            onClose={() => setCropSrc(null)}
            onConfirm={(dataUrl) => {
              setAvatarUrl(dataUrl);
              setCropSrc(null);
              toast.success("Avatar cropped");
            }}
          />
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`size-9 rounded-md bg-gradient-to-br ${c} ${
                  color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Kids profile</p>
            <p className="text-xs text-muted-foreground">
              Filters out mature titles so kids only see age-appropriate content.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={kids}
            onClick={() => setKids((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              kids ? "bg-emerald-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                kids ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4">
          {!hasPin ? (
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Parental PIN (optional)"
              aria-label="Parental PIN"
              maxLength={6}
              className="w-full rounded bg-neutral-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" /> A PIN is currently set
              </p>
              <button
                onClick={() => {
                  setRemovePinValue("");
                  setRemovePinOpen(true);
                }}
                disabled={busy}
                className="shrink-0 rounded border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-60"
              >
                Remove PIN
              </button>
            </div>
          )}
        </div>

        {removePinOpen && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-md bg-card p-6 shadow-2xl text-center">
              <Lock className="mx-auto size-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-1">Remove PIN</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the current PIN for &quot;{existing?.name}&quot; to remove it
              </p>
              <input
                type="password"
                value={removePinValue}
                onChange={(e) => setRemovePinValue(e.target.value)}
                maxLength={6}
                autoFocus
                placeholder="Enter current PIN"
                aria-label="Enter current PIN"
                className="w-full rounded bg-neutral-800 px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && removePinValue.trim()) removePin();
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRemovePinOpen(false);
                    setRemovePinValue("");
                  }}
                  className="flex-1 rounded border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={removePin}
                  disabled={removePinBusy || !removePinValue.trim()}
                  className="flex-1 rounded bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-60"
                >
                  {removePinBusy ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          {!isNew ? (
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-60"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
