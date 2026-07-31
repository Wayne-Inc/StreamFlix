import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { applyActionCode, confirmPasswordReset } from "firebase/auth";
import { toast } from "sonner";
import { Logo } from "@/components/streamflix/Logo";
import heroImg from "@/assets/hero-1.jpg";

export const Route = createFileRoute("/auth/action")({
  ssr: false,
  component: ActionPage,
});

function useQueryParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    mode: sp.get("mode"),
    oobCode: sp.get("oobCode"),
  };
}

function ActionPage() {
  const navigate = useNavigate();
  const params = useQueryParams();
  const { mode, oobCode } = params;
  const [status, setStatus] = useState<"loading" | "input" | "done" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setMsg("Invalid or missing link parameters.");
      setStatus("error");
      return;
    }

    if (mode === "verifyEmail" || mode === "recoverEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setMsg(
            mode === "verifyEmail"
              ? "Email verified successfully! You can now sign in."
              : "Email recovered successfully.",
          );
          setStatus("done");
        })
        .catch((err: any) => {
          setMsg(
            err?.message ?? `Failed to ${mode === "verifyEmail" ? "verify" : "recover"} email.`,
          );
          setStatus("error");
        });
    } else if (mode === "resetPassword") {
      setStatus("input");
    } else {
      setMsg("Unknown action.");
      setStatus("error");
    }
  }, [mode, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !newPw.trim()) return;
    setBusy(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPw.trim());
      toast.success("Password reset successfully. You can now sign in.");
      navigate({ to: "/auth" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh">
      <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10">
        <header className="px-4 sm:px-12 py-5">
          <Logo />
        </header>
        <div className="mx-auto mt-4 max-w-md rounded-md bg-black/75 p-8 sm:p-12">
          {mode === "resetPassword" ? (
            status === "input" ? (
              <>
                <h1 className="text-3xl font-bold">Reset Password</h1>
                <p className="mt-2 text-sm text-muted-foreground">Enter your new password below.</p>
                <form className="mt-6 space-y-4" onSubmit={handleReset}>
                  <input
                    required
                    minLength={6}
                    type="password"
                    placeholder="New password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    disabled={busy}
                    className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busy ? "Please wait…" : "Reset Password"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{status === "done" ? "Success" : "Error"}</h1>
                <p className="mt-4 text-sm text-muted-foreground">{msg}</p>
                <p className="mt-6">
                  <Link to="/auth" className="text-sm text-foreground hover:underline">
                    ← Back to sign in
                  </Link>
                </p>
              </>
            )
          ) : (
            <>
              <h1 className="text-3xl font-bold">
                {status === "loading" ? "Please wait…" : status === "done" ? "Success" : "Error"}
              </h1>
              {status === "loading" ? (
                <p className="mt-4 text-sm text-muted-foreground">Processing your request…</p>
              ) : (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">{msg}</p>
                  <p className="mt-6">
                    <Link to="/auth" className="text-sm text-foreground hover:underline">
                      ← Back to sign in
                    </Link>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
