import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/streamflix/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase";
import {
  createProfile,
  deleteProfile,
  ensureUserHasProfile,
  getUserProfiles,
  updateProfile,
  setProfilePin,
  type Profile,
} from "@/lib/profiles";

export const Route = createFileRoute("/_authenticated/profiles")({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (p: Profile) => {
    try {
      localStorage.setItem("sf:selectedProfile", JSON.stringify({ id: p.id, name: p.name, color: p.color, avatarUrl: p.avatarUrl }));
      window.dispatchEvent(new Event("profileChanged"));
    } catch {}
    navigate({ to: "/browse" });
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-background">
      <header className="absolute inset-x-0 top-0 px-4 sm:px-12 py-5"><Logo /></header>
      <div className="w-full max-w-4xl px-4 text-center">
        <h1 className="text-3xl font-medium sm:text-5xl">
          {editing ? "Manage Profiles:" : "Who's watching?"}
        </h1>

        {profiles === null ? (
          <ul className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="size-24 sm:size-32 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-8">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => (editing ? setEditTarget(p) : choose(p))}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className={`relative size-24 overflow-hidden rounded-lg transition-all group-hover:ring-4 group-hover:ring-foreground sm:size-32 ${p.avatarUrl ? "" : `bg-gradient-to-br ${p.color}`}`}>
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-3xl font-black text-white/90 sm:text-5xl">
                        {p.name[0]?.toUpperCase()}
                      </span>
                    )}
                    {editing && (
                      <div className="absolute inset-0 grid place-items-center bg-black/60">
                        <Pencil className="size-7 text-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                    {p.name} {p.kids && <span className="text-xs">(Kids)</span>}
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
                  <div className="grid size-24 place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors group-hover:border-foreground group-hover:text-foreground sm:size-32">
                    <Plus className="size-10" />
                  </div>
                  <span className="text-muted-foreground">Add Profile</span>
                </button>
              </li>
            )}
          </ul>
        )}

        <button
          onClick={() => setEditing((v) => !v)}
          className="mt-12 rounded border border-border px-6 py-2 text-sm tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground uppercase"
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
  const [color, setColor] = useState(
    existing?.color ?? COLORS[existingCount % COLORS.length]
  );
  const [avatarUrl, setAvatarUrl] = useState(existing?.avatarUrl ?? "");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

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
        await createProfile(u.uid, { name: name.trim(), kids, avatarUrl: avatarUrl.trim() || undefined });
        const list = await getUserProfiles(u.uid);
        const created = list.find((p) => p.name === name.trim());
        if (created) {
          await updateProfile(u.uid, created.id, { color, avatarUrl: avatarUrl.trim() || "" });
          if (pin.trim()) {
            await setProfilePin(u.uid, created.id, pin.trim());
          }
        }
        toast.success("Profile added");
      } else if (existing) {
        await updateProfile(u.uid, existing.id, { name: name.trim(), kids, color, avatarUrl: avatarUrl.trim() || "" });
        if (pin.trim()) {
          await setProfilePin(u.uid, existing.id, pin.trim());
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
      <div className="w-full max-w-md rounded-md bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isNew ? "Add Profile" : "Edit Profile"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-20 rounded-lg object-cover ring-2 ring-border" />
          ) : (
            <div className={`grid size-20 place-items-center rounded-lg bg-gradient-to-br ${color} text-3xl font-black text-white/90`}>
              {(name || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              className="w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Avatar URL (optional)"
              className="w-full rounded bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

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

        <label className="mt-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={kids}
            onChange={(e) => setKids(e.target.checked)}
            className="size-4"
          />
          Kids profile
        </label>

        <div className="mt-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Parental PIN (optional)"
            maxLength={6}
            className="w-full rounded bg-neutral-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          {!isNew ? (
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-60"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
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
