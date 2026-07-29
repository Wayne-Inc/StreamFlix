import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, updateProfile as updateFirebaseProfile, sendEmailVerification } from "firebase/auth";
import heroImg from "@/assets/hero-1.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign In — StreamFlix" }] }),
  component: AuthPage,
});

function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Redirect away if already signed in (use profile chooser).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) navigate({ to: "/profiles" });
    });
    return () => unsub();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setVerifyMsg("");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateFirebaseProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
        setVerifyMsg(`Verification email sent to ${email}. Please check your inbox and then sign in.`);
        setMode("signin");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await auth.signOut();
          setVerifyMsg("Please verify your email before signing in. Check your inbox.");
          return;
        }
        toast.success("Signed in.");
        navigate({ to: "/profiles" });
      }
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : err?.message ?? "Authentication failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setBusy(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email resent.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to resend");
    }
    setBusy(false);
  };

  const onGoogle = async () => {
    setBusy(true);
    setPopupBlocked(false);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google.");
      navigate({ to: "/profiles" });
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        setPopupBlocked(true);
      } else if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message ?? "Google sign-in failed");
      }
      setBusy(false);
    }
  };

  const s = strengthScore(password);
  const labels = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];

  return (
    <main className="relative min-h-dvh">
      <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10">
        <header className="px-4 sm:px-12 py-5">
          <Logo />
        </header>

        <div className="mx-auto mt-4 max-w-md rounded-md bg-black/75 p-8 sm:p-12">
          <h1 className="text-3xl font-bold">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {verifyMsg && (
              <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                {verifyMsg}
                {mode === "signin" && (
                  <button type="button" onClick={resendVerification} disabled={busy} className="ml-2 underline hover:no-underline">
                    Resend
                  </button>
                )}
              </div>
            )}
            {mode === "signup" && (
              <input
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="relative">
              <input
                required
                minLength={6}
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded bg-neutral-800 px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            {mode === "signup" && password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i < s ? colors[s - 1] : "bg-border"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{labels[Math.max(0, s - 1)]}</p>
              </div>
            )}

            <button
              disabled={busy}
              className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {popupBlocked && (
            <div className="mt-4 rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              Popup was blocked. Please{" "}
              <strong>allow popups for this site</strong> and try again, or
              sign in with email and password.
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <button
            onClick={onGoogle}
            disabled={busy}
            className="mt-4 w-full rounded bg-foreground/10 py-3 font-semibold text-foreground hover:bg-foreground/20 disabled:opacity-60"
          >
            Continue with Google
          </button>

          <p className="mt-8 text-muted-foreground">
            {mode === "signin" ? "New to StreamFlix?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-foreground hover:underline"
            >
              {mode === "signin" ? "Sign up now." : "Sign in."}
            </button>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Back to home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
