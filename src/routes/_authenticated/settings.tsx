import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Monitor, Smartphone, Tablet, Trash2, LogOut, Mail, User as UserIcon, ShieldCheck, CheckCircle2, Camera, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut as firebaseSignOut, sendEmailVerification } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeviceId, recordCurrentDevice } from "@/lib/device-tracking";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Account Settings — StreamFlix" }] }),
  component: SettingsPage,
});

type Device = {
  id: string;
  device_id: string;
  device_label: string;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  last_seen_at: Timestamp | null;
  created_at: Timestamp | null;
};

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  show_google_pfp: boolean;
};

function deviceIcon(label: string) {
  if (/Mobile/i.test(label)) return Smartphone;
  if (/Tablet/i.test(label)) return Tablet;
  return Monitor;
}

function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const currentDeviceId = typeof window !== "undefined" ? getDeviceId() : "";

  useEffect(() => {
    recordCurrentDevice();
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const snap = await getDoc(doc(db, "profiles", user.uid));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { id: snap.id, display_name: d.display_name ?? "", avatar_url: d.avatar_url ?? null, show_google_pfp: d.show_google_pfp ?? true };
    },
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile?.display_name, profile?.avatar_url]);

  const googlePhotoURL: string | undefined = user?.photoURL ?? undefined;

  const useGooglePfp = async () => {
    if (!googlePhotoURL || !user) return;
    setSavingName(true);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        avatar_url: googlePhotoURL,
        show_google_pfp: true,
        updated_at: serverTimestamp(),
      }, { merge: true });
      setAvatarUrl(googlePhotoURL);
      setAvatarInput("");
      toast.success("Avatar updated to Google profile picture");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const saveAvatarUrl = async () => {
    if (!user || !avatarInput.trim()) return;
    setSavingName(true);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        avatar_url: avatarInput.trim(),
        updated_at: serverTimestamp(),
      }, { merge: true });
      setAvatarUrl(avatarInput.trim());
      toast.success("Avatar updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const removeAvatar = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        avatar_url: "",
        show_google_pfp: false,
        updated_at: serverTimestamp(),
      }, { merge: true });
      setAvatarUrl("");
      setAvatarInput("");
      toast.success("Avatar removed");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const devicesQ = useQuery({
    queryKey: ["user_devices", user?.uid],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Device[]> => {
      if (!user) return [];
      const q = query(
        collection(db, "user_devices"),
        where("user_id", "==", user.uid),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Device))
        .sort((a, b) => {
          const ta = a.last_seen_at?.toDate().getTime() ?? 0;
          const tb = b.last_seen_at?.toDate().getTime() ?? 0;
          return tb - ta;
        });
    },
  });

  const removeDevice = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "user_devices", id));
    },
    onSuccess: () => {
      toast.success("Device removed");
      qc.invalidateQueries({ queryKey: ["user_devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAllOthers = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const q = query(
        collection(db, "user_devices"),
        where("user_id", "==", user.uid),
      );
      const snap = await getDocs(q);
      const deletes = snap.docs
        .filter((d) => d.data().device_id !== currentDeviceId)
        .map((d) => deleteDoc(doc(db, "user_devices", d.id)));
      await Promise.all(deletes);
    },
    onSuccess: () => {
      toast.success("Signed out of all other devices");
      qc.invalidateQueries({ queryKey: ["user_devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        display_name: displayName.trim(),
        updated_at: serverTimestamp(),
      }, { merge: true });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const signOut = async () => {
    if (user) {
      const q = query(
        collection(db, "user_devices"),
        where("user_id", "==", user.uid),
        where("device_id", "==", currentDeviceId),
      );
      const snap = await getDocs(q);
      snap.forEach((d) => deleteDoc(doc(db, "user_devices", d.id)));
    }
    await firebaseSignOut(auth);
    router.navigate({ to: "/auth", replace: true });
  };

  const createdAt = user?.metadata?.creationTime ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, security, and signed-in devices.</p>

        {/* Profile */}
        <section className="mt-8 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserIcon className="size-4" /> Profile
          </div>
          {profileLoading ? (
            <div className="mt-5 flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="size-24 rounded-full" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={i === 5 ? "sm:col-span-2" : ""}>
                    <Skeleton className="h-3 w-20 mb-1 rounded" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <div className="mt-5 flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-24 rounded-full object-cover ring-2 ring-border" />
              ) : googlePhotoURL && (profile?.show_google_pfp ?? true) ? (
                <img src={googlePhotoURL} alt="" className="size-24 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-red-700 text-4xl font-black text-white/90">
                  {(displayName || user?.email || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {googlePhotoURL && (profile?.show_google_pfp ?? true) && (
                  <button
                    onClick={useGooglePfp}
                    disabled={savingName}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Check className="size-3" /> Use Google photo
                  </button>
                )}
                {(avatarUrl || (googlePhotoURL && (profile?.show_google_pfp ?? true))) && (
                  <button
                    onClick={removeAvatar}
                    disabled={savingName}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <span className="min-w-0 break-all">{user?.email ?? "—"}</span>
                  {user?.emailVerified ? (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 shrink-0 whitespace-nowrap">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!user) return;
                        try {
                          await sendEmailVerification(user);
                          toast.success("Verification email sent.");
                        } catch (e: any) {
                          toast.error(e.message);
                        }
                      }}
                      className="ml-auto shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] hover:bg-accent whitespace-nowrap"
                    >
                      Verify email
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="dn" className="text-xs uppercase tracking-wider text-muted-foreground">Display name</label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="dn"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName || !displayName.trim() || displayName === profile?.display_name}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {savingName ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Member since</label>
                <div className="mt-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">User ID</label>
                <div className="mt-1 truncate sm:truncate sm:rounded-md border border-border bg-background/60 px-3 py-2 text-xs font-mono text-muted-foreground break-all">
                  {user?.uid ?? "—"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="avatarUrl" className="text-xs uppercase tracking-wider text-muted-foreground">Custom avatar URL</label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="avatarUrl"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={saveAvatarUrl}
                    disabled={savingName || !avatarInput.trim()}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                  >
                    <Camera className="size-4" /> Set
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </section>

        {/* Devices */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4" /> Devices signed in
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Recently active devices on your account. Remove any you don't recognise.
              </p>
            </div>
            <button
              onClick={() => removeAllOthers.mutate()}
              disabled={removeAllOthers.isPending || (devicesQ.data?.length ?? 0) <= 1}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40"
            >
              Sign out other devices
            </button>
          </div>

          <div className="mt-5 divide-y divide-border rounded-md border border-border bg-background/40">
            {devicesQ.isLoading && (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <Skeleton className="size-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-3 w-56 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!devicesQ.isLoading && (devicesQ.data?.length ?? 0) === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No devices recorded yet.</div>
            )}
            {devicesQ.data?.map((d) => {
              const Icon = deviceIcon(d.device_label);
              const isCurrent = d.device_id === currentDeviceId;
              const lastSeen = d.last_seen_at?.toDate();
              return (
                <div key={d.id} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{d.device_label}</p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="size-3" /> This device
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.ip_address ?? "IP unknown"} · Last active{" "}
                      {lastSeen ? formatDistanceToNow(lastSeen, { addSuffix: true }) : "unknown"}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => removeDevice.mutate(d.id)}
                      disabled={removeDevice.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                      aria-label="Remove device"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <TraktSection />

        {/* Danger */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Sign out</p>
              <p className="mt-1 text-xs text-muted-foreground">End this session on this device.</p>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link to="/browse" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to browsing
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

type TraktConnection = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

function TraktSection() {
  const [conn, setConn] = useState<TraktConnection | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem("streamflix:trakt");
        setConn(raw ? (JSON.parse(raw) as TraktConnection) : null);
      } catch {
        setConn(null);
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const connect = () => {
    const clientId = import.meta.env.VITE_TRAKT_CLIENT_ID as string | undefined;
    if (!clientId) {
      toast.error("Trakt is not configured.");
      return;
    }
    const redirect = `${window.location.origin}/trakt-callback`;
    const url = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirect)}`;
    window.location.href = url;
  };

  const disconnect = () => {
    window.localStorage.removeItem("streamflix:trakt");
    setConn(null);
    toast.success("Trakt disconnected");
  };

  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {conn?.avatar ? (
            <img src={conn.avatar} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-red-600 font-bold text-white">T</div>
          )}
          <div>
            <p className="text-sm font-semibold">Trakt</p>
            {conn ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Connected as <span className="text-foreground">@{conn.username ?? "trakt"}</span>
                {conn.name ? ` (${conn.name})` : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sign in with Trakt to sync ratings, history, and watchlists.
              </p>
            )}
          </div>
        </div>
        {conn ? (
          <button
            onClick={disconnect}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={connect}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Connect Trakt
          </button>
        )}
      </div>
      <div className="mt-4 rounded-lg bg-background/80 p-3 text-sm text-muted-foreground">
        {!conn ? (
          <p>
            Trakt connection is stored locally in this browser. If you change devices, reconnect Trakt to keep syncing your ratings and watch history.
          </p>
        ) : (
          <p>
            Your Trakt session is active in this browser. Disconnect to remove local Trakt access and stop syncing watch data for this device.
          </p>
        )}
      </div>
    </section>
  );
}
