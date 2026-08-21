import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Check,
  Crown,
  KeyRound,
  EyeOff,
  Bell,
  BellOff,
  BellRing,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
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
import { AvatarCropModal } from "@/components/streamflix/AvatarCropModal";
import { getDeviceId, recordCurrentDevice } from "@/lib/device-tracking";
import { isKidsProfile } from "@/lib/kids-mode";
import { useReduceMotion } from "@/lib/reduce-motion";
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
  const [savingName, setSavingName] = useState(false);
  const currentDeviceId = typeof window !== "undefined" ? getDeviceId() : "";
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ state: string; message: string } | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const { reduceMotion, setReduceMotion } = useReduceMotion();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [notifBusy, setNotifBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [notifUnsupported, setNotifUnsupported] = useState(false);
  const [notifReason, setNotifReason] = useState<string | null>(null);

  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  useEffect(() => {
    import("@/lib/push").then(({ checkPushSupport }) =>
      checkPushSupport().then(({ ok, reason }) => {
        if (!ok) {
          setNotifUnsupported(true);
          setNotifReason(reason ?? "Unknown reason");
        } else {
          // Check current permission state (skip on Capacitor — uses native flow)
          const isCap = typeof window !== "undefined" &&
            "Capacitor" in window &&
            (window as any).Capacitor?.isNativePlatform?.();
          if (!isCap && typeof Notification !== "undefined") {
            setNotifPermission(Notification.permission);
            setHasToken(Notification.permission === "granted");
          }
        }
      })
    );
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getVersion().then(setAppVersion).catch(() => {});
    const unsubscribe = window.electronAPI.onUpdaterStatus((status) => {
      setUpdateStatus(status);
      setUpdateBusy(false);
      if (status.state === "downloaded") {
        toast.success("Update downloaded. Restart to install.", {
          action: {
            label: "Restart now",
            onClick: () => window.electronAPI?.installUpdate(),
          },
        });
      } else if (status.state === "uptodate") {
        toast.success(status.message);
      } else if (status.state === "error") {
        toast.error(status.message);
      }
    });
    return unsubscribe;
  }, []);

  const checkForUpdates = async () => {
    if (!window.electronAPI) return;
    setUpdateBusy(true);
    try {
      const res = await window.electronAPI.checkForUpdates();
      setUpdateStatus(res);
      if (res.state === "dev") {
        setUpdateBusy(false);
        toast.info(res.message);
      } else if (res.state === "checking") {
        setUpdateStatus(res);
      }
    } catch {
      setUpdateBusy(false);
      toast.error("Could not check for updates.");
    }
  };

  const providers = user?.providerData ?? [];
  const canChangePassword =
    !!user?.email &&
    providers.some((p) => p.providerId === "password") &&
    !providers.some((p) => p.providerId === "google.com");

  const sendResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Password reset email sent to ${user.email}.`);
    } catch (e: any) {
      if (e?.code === "auth/too-many-requests") {
        toast.error("Too many requests. Try again later.");
      } else {
        toast.error(e?.message ?? "Failed to send password reset email.");
      }
    } finally {
      setSendingReset(false);
    }
  };

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
      return {
        id: snap.id,
        display_name: d.display_name ?? "",
        avatar_url: d.avatar_url ?? null,
        show_google_pfp: d.show_google_pfp ?? true,
      };
    },
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile?.display_name, profile?.avatar_url]);

  const googlePhotoURL: string | undefined = user?.photoURL ?? undefined;

  const { data: isVip } = useQuery({
    queryKey: ["vip", user?.uid],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;
      const snap = await getDoc(doc(db, "vip", user.uid));
      return snap.exists();
    },
  });

  const useGooglePfp = async () => {
    if (!googlePhotoURL || !user) return;
    setSavingName(true);
    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          avatar_url: googlePhotoURL,
          show_google_pfp: true,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      setAvatarUrl(googlePhotoURL);
      toast.success("Avatar updated to Google profile picture");
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
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          avatar_url: "",
          show_google_pfp: false,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      setAvatarUrl("");
      toast.success("Avatar removed");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingName(false);
  };

  const onFilePicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveUploadedAvatar = async (dataUrl: string) => {
    if (!user) return;
    setSavingName(true);
    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          avatar_url: dataUrl,
          show_google_pfp: false,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      setAvatarUrl(dataUrl);
      setCropSrc(null);
      toast.success("Avatar updated");
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
      const q = query(collection(db, "user_devices"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Device)
        .sort((a, b) => {
          const ta = a.last_seen_at?.toDate().getTime() ?? 0;
          const tb = b.last_seen_at?.toDate().getTime() ?? 0;
          return tb - ta;
        });
    },
  });

  const deviceQueryKey = ["user_devices", user?.uid] as const;

  const removeDevice = useMutation({
    mutationFn: async (d: Device) => {
      if (d.device_id === currentDeviceId) return;
      await deleteDoc(doc(db, "user_devices", d.id));
    },
    onMutate: async (d: Device) => {
      if (d.device_id === currentDeviceId) return { prev: undefined };
      await qc.cancelQueries({ queryKey: deviceQueryKey });
      const prev = qc.getQueryData<Device[]>(deviceQueryKey);
      qc.setQueryData<Device[]>(deviceQueryKey, (old) => (old ?? []).filter((dev) => dev.id !== d.id));
      return { prev };
    },
    onError: (e: Error, _d, context) => {
      if (context?.prev) qc.setQueryData(deviceQueryKey, context.prev);
      toast.error(e.message);
    },
    onSuccess: () => {
      toast.success("Device removed");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: deviceQueryKey });
    },
  });

  const removeAllOthers = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const q = query(collection(db, "user_devices"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      const deletes = snap.docs
        .filter((d) => d.data().device_id !== currentDeviceId)
        .map((d) => deleteDoc(doc(db, "user_devices", d.id)));
      await Promise.all(deletes);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: deviceQueryKey });
      const prev = qc.getQueryData<Device[]>(deviceQueryKey);
      qc.setQueryData<Device[]>(deviceQueryKey, (old) =>
        (old ?? []).filter((d) => d.device_id === currentDeviceId),
      );
      return { prev };
    },
    onError: (e: Error, _vars, context) => {
      if (context?.prev) qc.setQueryData(deviceQueryKey, context.prev);
      toast.error(e.message);
    },
    onSuccess: () => {
      toast.success("Signed out of all other devices");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: deviceQueryKey });
    },
  });

  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          display_name: displayName.trim(),
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
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
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, and signed-in devices.
        </p>

        {/* VIP (only for users listed in the vip collection) */}
        {isVip && (
          <section className="mt-8 rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 via-amber-500/5 to-transparent p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-yellow-500/20 text-yellow-400">
                <Crown className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-yellow-400">VIP Member</p>
                  <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
                    Exclusive
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enjoy an ad-free experience, early access to new releases, and priority support.
                </p>
              </div>
            </div>
          </section>
        )}

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
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-24 rounded-full object-cover ring-2 ring-border"
                  />
                ) : googlePhotoURL && (profile?.show_google_pfp ?? true) ? (
                  <img
                    src={googlePhotoURL}
                    alt=""
                    className="size-24 rounded-full object-cover ring-2 ring-border"
                  />
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingName}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <Upload className="size-3" /> Upload
                  </button>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFilePicked(e.target.files?.[0])}
                />
              </div>
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <span
                      className="min-w-0 truncate"
                      style={{
                        fontSize:
                          (user?.email?.length ?? 0) > 30
                            ? `${Math.max(11, 14 - ((user?.email?.length ?? 0) - 30) * 0.12)}px`
                            : undefined,
                      }}
                    >
                      {user?.email ?? "—"}
                    </span>
                    {user?.emailVerified ? (
                      <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-400" />
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
                  <label
                    htmlFor="dn"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Display name
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="dn"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={saveName}
                      disabled={
                        savingName || !displayName.trim() || displayName === profile?.display_name
                      }
                      className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {savingName ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Member since
                  </label>
                  <div className="mt-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    User ID
                  </label>
                  <div className="mt-1 truncate sm:truncate sm:rounded-md border border-border bg-background/60 px-3 py-2 text-xs font-mono text-muted-foreground break-all">
                    {user?.uid ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Security */}
        {canChangePassword && (
          <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4" /> Password
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll send a password reset link to {user.email}. Follow the link to set a new
              password for your account.
            </p>
            <div className="mt-4">
              <button
                onClick={sendResetEmail}
                disabled={sendingReset}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {sendingReset ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                {sendingReset ? "Sending..." : "Send reset email"}
              </button>
            </div>
          </section>
        )}

        {/* Accessibility */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <EyeOff className="size-4" /> Accessibility
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Customize your viewing experience. Reduce motion disables animations and transitions.
          </p>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Reduce Motion</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Disable animations, transitions, and auto-rotating carousels.
              </p>
            </div>
            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                reduceMotion ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={reduceMotion}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  reduceMotion ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Desktop app (Electron only) */}
        {isElectron && (
          <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Monitor className="size-4" /> Desktop app
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  StreamFlix Desktop · Version {appVersion ?? "—"}
                </p>
              </div>
              <button
                onClick={checkForUpdates}
                disabled={updateBusy}
                className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-40"
              >
                {updateBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Check for updates
              </button>
            </div>
            {updateStatus && updateStatus.state !== "dev" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {updateStatus.state === "downloading" && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  {updateStatus.message}
                </span>
                {updateStatus.state === "downloaded" && (
                  <button
                    onClick={() => window.electronAPI?.installUpdate()}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Restart &amp; install
                  </button>
                )}
              </div>
            )}
          </section>
        )}

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
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No devices recorded yet.
              </div>
            )}
            {devicesQ.data?.map((d) => {
              const Icon = deviceIcon(d.device_label);
              const isCurrent = d.device_id === currentDeviceId;
              const lastSeen = d.last_seen_at?.toDate();
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4"
                >
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
                      onClick={() => removeDevice.mutate(d)}
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

        {/* Notifications */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`grid size-10 shrink-0 place-items-center rounded-md ${
                notifPermission === "granted" && hasToken
                  ? "bg-emerald-500/15 text-emerald-400"
                  : notifPermission === "denied"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-accent text-muted-foreground"
              }`}>
                {notifPermission === "denied" ? (
                  <BellOff className="size-5" />
                ) : notifPermission === "granted" && hasToken ? (
                  <BellRing className="size-5" />
                ) : (
                  <Bell className="size-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notifUnsupported
                    ? notifReason ?? "Not supported on this device"
                    : notifPermission === "granted" && hasToken
                    ? "Enabled — you'll receive release reminders and updates"
                    : notifPermission === "denied"
                    ? "Blocked — enable in your browser settings and reload"
                    : "Not enabled yet — get notified about new releases"}
                </p>
              </div>
            </div>
            {notifUnsupported ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                <BellOff className="size-3.5" /> Unavailable
              </span>
            ) : notifPermission === "denied" ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                <BellOff className="size-3.5" /> Blocked
              </span>
            ) : hasToken ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="size-3.5" /> Active
              </span>
            ) : (
              <button
                onClick={async () => {
                  if (notifBusy) return;
                  setNotifBusy(true);
                  try {
                    const { checkPushSupport, ensurePushSubscription } = await import("@/lib/push");
                    const support = await checkPushSupport();
                    if (!support.ok) {
                      setNotifUnsupported(true);
                      setNotifReason(support.reason ?? "Unknown");
                      toast.error(support.reason ?? "Not supported on this device");
                      return;
                    }
                    const status = await ensurePushSubscription();
                    if (status === "granted") {
                      setHasToken(true);
                      if (typeof Notification !== "undefined") {
                        setNotifPermission(Notification.permission);
                      }
                    }
                    if (status === "granted") {
                      toast.success("Notifications enabled!");
                    } else if (status === "denied") {
                      toast.error("Permission denied — enable in browser settings");
                    } else if (status === "no-vapid") {
                      toast.error("Push not configured on this server");
                    } else {
                      const { checkPushSupport: recheck } = await import("@/lib/push");
                      const r = await recheck();
                      setNotifUnsupported(!r.ok);
                      setNotifReason(r.reason ?? "Unknown error");
                      toast.error(r.reason ?? "Notifications unavailable");
                    }
                  } catch {
                    toast.error("Failed to enable notifications");
                  } finally {
                    setNotifBusy(false);
                  }
                }}
                disabled={notifBusy}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {notifBusy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                {notifBusy ? "Enabling..." : "Enable Notifications"}
              </button>
            )}
          </div>
        </section>

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
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onConfirm={saveUploadedAvatar}
        />
      )}
      <Footer />
    </div>
  );
}
