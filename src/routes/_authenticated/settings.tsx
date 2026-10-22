import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Mail, User, Palette, Settings, Shield, X } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { auth } from "@/lib/firebase";
import { getFavoriteGenres, setFavoriteGenres, GENRE_OPTIONS } from "@/lib/favorite-genres";
import { passwordMeetsPolicy } from "@/lib/password";
import { PasswordPolicyChecklist } from "@/components/streamflix/PasswordPolicyChecklist";
import { ConfirmDialog } from "@/components/streamflix/ConfirmDialog";
import {
  updateProfile as updateFirebaseProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { deleteUserData } from "@/lib/user-data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — StreamFlix" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = auth.currentUser;
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "security" | "danger">("account");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Account form
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newEmail, setNewEmail] = useState("");
  const [saveAccountBusy, setSaveAccountBusy] = useState(false);

  // Preferences
  const [genres, setGenres] = useState<number[]>([]);
  const [genresLoaded, setGenresLoaded] = useState(false);
  const [saveGenresBusy, setSaveGenresBusy] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordBusy, setChangePasswordBusy] = useState(false);

  useEffect(() => {
    if (user) {
      getFavoriteGenres(user.uid).then((g) => {
        setGenres(g);
        setGenresLoaded(true);
      });
    }
  }, [user]);

  const saveAccount = async () => {
    if (!user) return;
    setSaveAccountBusy(true);
    try {
      if (displayName.trim() !== (user.displayName || "").trim()) {
        await updateFirebaseProfile(user, { displayName: displayName.trim() });
      }
      if (newEmail.trim() && newEmail !== user.email) {
        await updateEmail(user, newEmail.trim());
        toast.success("Email updated. Please check your new email for verification.");
      }
      toast.success("Account settings saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save account settings");
    } finally {
      setSaveAccountBusy(false);
    }
  };

  const saveGenres = async () => {
    if (!user) return;
    if (genres.length === 0) {
      toast.error("Pick at least one genre");
      return;
    }
    if (genres.length > 5) {
      toast.error("You can pick up to 5 genres");
      return;
    }
    setSaveGenresBusy(true);
    try {
      await setFavoriteGenres(user.uid, genres);
      toast.success("Preferences saved");
    } catch {
      toast.error("Couldn't save preferences");
    } finally {
      setSaveGenresBusy(false);
    }
  };

  const changePassword = async () => {
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!passwordMeetsPolicy(newPassword)) {
      toast.error("New password doesn't meet requirements");
      return;
    }
    setChangePasswordBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : err?.message ?? "Failed to change password";
      toast.error(msg);
    } finally {
      setChangePasswordBusy(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    if (!currentPassword) {
      toast.error("Enter your password to confirm");
      return;
    }
    setDeleteBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Delete all user data from Firestore first
      await deleteUserData(user.uid);

      // Then delete the auth account
      await deleteUser(user);

      // Sign out and redirect
      await signOut(auth);
      toast.success("Account deleted permanently");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : err?.message ?? "Failed to delete account";
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleGenre = (id: number) => {
    setGenres((cur) => {
      if (cur.includes(id)) return cur.filter((g) => g !== id);
      if (cur.length >= 5) {
        toast.error("You can pick up to 5 genres");
        return cur;
      }
      return [...cur, id];
    });
  };

  if (!user) {
    throw redirect({ to: "/auth" });
  }

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ] as const;

  return (
    <main className="relative min-h-dvh bg-background">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-4 sm:px-12 py-5">
          <Logo />
        </header>

        <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-12">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <nav className="flex gap-1 mb-8 overflow-x-auto pb-2" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "account" && (
            <section className="space-y-6" aria-labelledby="account-heading">
              <h2 id="account-heading" className="text-xl font-semibold">
                Account Settings
              </h2>

              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Current Email</label>
                  <div className="flex items-center gap-3">
                    <input
                      value={user.email || ""}
                      readOnly
                      className="flex-1 rounded bg-neutral-800 px-4 py-3 text-muted-foreground"
                    />
                    {!user.emailVerified && (
                      <button
                        onClick={sendVerificationEmail}
                        disabled={busy}
                        className="shrink-0 rounded border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                      >
                        {busy ? "Sending..." : "Verify"}
                      </button>
                    )}
                  </div>
                  {!user.emailVerified && (
                    <p className="mt-1 text-xs text-amber-400">Your email is not verified. Some features may be limited.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium mb-1">
                    Change Email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="email"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    A verification link will be sent to the new address.
                  </p>
                </div>

                <button
                  onClick={saveAccount}
                  disabled={saveAccountBusy}
                  className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saveAccountBusy ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </section>
          )}

          {activeTab === "preferences" && (
            <section className="space-y-6" aria-labelledby="preferences-heading">
              <h2 id="preferences-heading" className="text-xl font-semibold">
                Content Preferences
              </h2>

              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select your favorite genres to personalize recommendations. Pick up to 5.
                </p>

                {!genresLoaded ? (
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full border h-10 px-4 animate-pulse bg-neutral-800"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((g) => {
                      const selected = genres.includes(g.id);
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
                )}

                <p className="text-xs text-muted-foreground">{genres.length}/5 selected</p>

                <button
                  onClick={saveGenres}
                  disabled={saveGenresBusy || genres.length === 0}
                  className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saveGenresBusy ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <section className="space-y-6" aria-labelledby="security-heading">
              <h2 id="security-heading" className="text-xl font-semibold">
                Security
              </h2>

              <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full rounded bg-neutral-800 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full rounded bg-neutral-800 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="mt-2 animate-checklist-drop space-y-1 rounded-md border border-border/60 bg-neutral-900/40 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Password requirements</p>
                          <PasswordPolicyChecklist password={newPassword} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full rounded bg-neutral-800 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={changePassword}
                      disabled={changePasswordBusy || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {changePasswordBusy ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-lg font-medium mb-4">Email Verification</h3>
                  {!user.emailVerified ? (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-amber-400">Your email is not verified.</p>
                      <button
                        onClick={sendVerificationEmail}
                        disabled={busy}
                        className="shrink-0 rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                      >
                        {busy ? "Sending..." : "Resend Verification"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-400">Your email is verified.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "danger" && (
            <section className="space-y-6" aria-labelledby="danger-heading">
              <h2 id="danger-heading" className="text-xl font-semibold text-destructive">
                Danger Zone
              </h2>

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    All your profiles, watch history, saved items, and preferences will be permanently removed.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="deletePassword" className="block text-sm font-medium mb-1">
                        Enter your password to confirm
                      </label>
                      <input
                        id="deletePassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={deleteBusy || !currentPassword}
                      className="w-full rounded border border-destructive bg-transparent py-3 font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      {deleteBusy ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {confirmDelete && (
            <ConfirmDialog
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              title="Delete Account Permanently?"
              description={
                <>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your account and <strong>all your data</strong>:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>All profiles and their settings</li>
                    <li>Watch history and continue watching</li>
                    <li>My List saved items</li>
                    <li>Genre preferences and recommendations</li>
                    <li>Device and session data</li>
                  </ul>
                  <p className="mt-3 text-sm text-destructive">
                    This action cannot be undone.
                  </p>
                </>
              }
              confirmText="Delete Forever"
              onConfirm={handleDeleteAccount}
              confirmClassName="bg-destructive hover:bg-destructive/90"
              disabled={deleteBusy}
            />
          )}
        </div>
      </div>
    </main>
  );
}