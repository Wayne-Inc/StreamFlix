import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { passwordMeetsPolicy } from "@/lib/password";
import { PasswordPolicyChecklist } from "@/components/streamflix/PasswordPolicyChecklist";

export const Route = createFileRoute("/_authenticated/force-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Update Password — StreamFlix" }] }),
  component: ForcePasswordPage,
});

function ForcePasswordPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const clearPending = () => {
    try {
      localStorage.removeItem("sf:upgrade_password");
    } catch {}
  };

  if (!user || !user.email) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card/40 p-6 text-center">
          <ShieldCheck className="mx-auto mb-3 size-10 text-primary" />
          <h1 className="text-lg font-semibold">Update your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No password is associated with this account.
          </p>
          <button
            onClick={() => navigate({ to: "/profiles" })}
            className="mt-4 rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMeetsPolicy(newPw)) {
      toast.error(
        "Password must include uppercase, lowercase, number, and special characters (min 8 characters).",
      );
      return;
    }
    if (!currentPw) {
      toast.error("Enter your current password.");
      return;
    }
    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      clearPending();
      toast.success("Password updated.");
      navigate({ to: "/profiles" });
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : (err?.message ?? "Failed to update password.");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card/60 p-8 sm:p-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-bold">Update your password</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          For your account's security, please set a stronger password for{" "}
          <span className="text-foreground">{user.email}</span>.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label
              htmlFor="cur-pw"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Current password
            </label>
            <input
              id="cur-pw"
              required
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="mt-1 w-full rounded bg-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="new-pw"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="new-pw"
                required
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 w-full rounded bg-neutral-800 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-neutral-900/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Password requirements</p>
            <PasswordPolicyChecklist password={newPw} />
          </div>
          <button
            type="submit"
            disabled={busy || !passwordMeetsPolicy(newPw)}
            className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update Password"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut(auth);
              navigate({ to: "/auth" });
            }}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
