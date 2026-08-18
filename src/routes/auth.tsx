import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { auth } from "@/lib/firebase";
import { passwordMeetsPolicy } from "@/lib/password";
import { PasswordPolicyChecklist } from "@/components/streamflix/PasswordPolicyChecklist";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import heroImg from "@/assets/hero-1.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign In — StreamFlix" }] }),
  component: AuthPage,
});

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
  const [forgotPw, setForgotPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Rate limiting
  const checkRateLimit = (): boolean => {
    try {
      const key = "sf:auth_attempts";
      const raw = localStorage.getItem(key);
      const now = Date.now();
      const attempts: number[] = raw ? JSON.parse(raw) : [];
      const recent = attempts.filter((t) => now - t < 60000);
      if (recent.length >= 5) {
        const oldest = recent[0];
        const wait = Math.ceil((60000 - (now - oldest)) / 1000);
        toast.error(`Too many attempts. Try again in ${wait}s`);
        return false;
      }
      recent.push(now);
      localStorage.setItem(key, JSON.stringify(recent));
      return true;
    } catch {
      return true;
    }
  };

  // Redirect away if already signed in (use profile chooser), unless a
  // password upgrade is pending.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      let pending = false;
      try {
        pending = localStorage.getItem("sf:upgrade_password") === "1";
      } catch {}
      const onUpgrade =
        typeof window !== "undefined" && window.location.pathname === "/force-password";
      if (user && user.emailVerified && !pending && !onUpgrade) navigate({ to: "/profiles" });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (mode !== "signin" || forgotPw) {
      setCaptchaVerified(true);
      return;
    }
    setCaptchaVerified(false);
    import("@/lib/captcha").then(({ renderCaptcha }) => {
      setTimeout(() => {
        if (captchaRef.current) {
          renderCaptcha(
            "auth-captcha",
            () => setCaptchaVerified(true),
            () => setCaptchaVerified(false),
          );
        }
      }, 100);
    });
  }, [mode, forgotPw]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit()) return;
    if (mode === "signin" && !captchaVerified) {
      toast.error("Please complete the CAPTCHA before proceeding.");
      return;
    }
    setBusy(true);
    setVerifyMsg("");
    try {
      if (mode === "signin") {
        const { getCaptchaToken, resetCaptcha } = await import("@/lib/captcha");
        const token = await getCaptchaToken();
        if (!token || !captchaVerified) {
          toast.error("Please complete the CAPTCHA");
          setBusy(false);
          return;
        }
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await auth.signOut();
          setVerifyMsg("Please verify your email before signing in. Check your inbox.");
          setBusy(false);
          return;
        }
        resetCaptcha();
        if (!passwordMeetsPolicy(password)) {
          try {
            localStorage.setItem("sf:upgrade_password", "1");
          } catch {}
          toast.error(
            "Your password doesn't meet the new security requirements. Please set a stronger one.",
          );
          navigate({ to: "/force-password" });
          return;
        }
        try {
          localStorage.removeItem("sf:upgrade_password");
        } catch {}
        toast.success("Signed in.");
        navigate({ to: "/profiles" });
      } else {
        if (!passwordMeetsPolicy(password)) {
          toast.error(
            "Password must include uppercase, lowercase, number, and special characters (min 8 characters).",
          );
          setBusy(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateFirebaseProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
        setVerifyMsg(
          `Verification email sent to ${email}. Please check your inbox and then sign in.`,
        );
        setMode("signin");
      }
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : (err?.message ?? "Authentication failed.");
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

  const onForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      toast.success("Password reset email sent.");
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : (err?.message ?? "Failed to send reset email.");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setPopupBlocked(false);
    const provider = new GoogleAuthProvider();
    const inNativeApp =
      typeof window !== "undefined" &&
      typeof (window as any).Capacitor?.isNativePlatform === "function" &&
      (window as any).Capacitor.isNativePlatform();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google.");
      navigate({ to: "/profiles" });
    } catch (err: any) {
      if (inNativeApp) {
        try {
          const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string;
          const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
          const appId = import.meta.env.VITE_FIREBASE_APP_ID as string;
          const redirectUrl = import.meta.env.VITE_SITE_URL as string;
          const authUrl =
            `https://${authDomain}/__/auth/handler` +
            `?apiKey=${encodeURIComponent(apiKey)}` +
            `&appName=${encodeURIComponent(appId)}` +
            `&authType=signInViaRedirect` +
            `&redirectUrl=${encodeURIComponent(redirectUrl + "/auth")}` +
            `&providerId=google.com` +
            `&scopes=profile`;
          const cap = (window as any).Capacitor?.Plugins?.GoogleAuth;
          if (!cap) {
            toast.error("Google Auth plugin not available.");
            setBusy(false);
            return;
          }
          let resultUrl: string | null = null;
          const r = await cap.openUrl({ url: authUrl });
          resultUrl = r?.url ?? null;
          if (resultUrl) {
            const hash = resultUrl.split("#")[1] || "";
            const params = new URLSearchParams(hash);
            const idToken = params.get("id_token");
            const accessToken = params.get("access_token");
            if (idToken || accessToken) {
              const credential = GoogleAuthProvider.credential(idToken, accessToken);
              await signInWithCredential(auth, credential);
              toast.success("Signed in with Google.");
              navigate({ to: "/profiles" });
              return;
            }
          }
          toast.error("Google sign-in failed: no tokens received.");
        } catch (pluginErr: any) {
          toast.error(pluginErr?.message ?? "Google sign-in failed");
        }
      } else if (err?.code === "auth/popup-blocked") {
        setPopupBlocked(true);
      } else if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message ?? "Google sign-in failed");
      }
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh">
      <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-4 sm:px-12 py-5">
          <Logo />
          <Link
            to="/"
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            Back to Home
          </Link>
        </header>

        <div className="mx-auto mt-4 max-w-md rounded-md bg-black/75 p-8 sm:p-12">
          <h1 className="text-3xl font-bold">
            {forgotPw ? "Reset Password" : mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          {forgotPw ? (
            <form className="mt-6 space-y-4" onSubmit={onForgotPassword}>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <input
                required
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {resetSent && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  Check your inbox. If an account with that email exists, a reset link has been
                  sent.
                </div>
              )}
              <button
                disabled={busy}
                className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Please wait…" : "Send Reset Link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotPw(false);
                  setResetSent(false);
                }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3" /> Back to sign in
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {verifyMsg && (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                  {verifyMsg}
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={busy}
                      className="ml-2 underline hover:no-underline"
                    >
                      Resend
                    </button>
                  )}
                </div>
              )}
              {mode === "signup" && (
                <input
                  required
                  placeholder="Full name"
                  aria-label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              <input
                required
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded bg-neutral-800 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="relative">
                <input
                  required
                  minLength={8}
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  aria-label="Password"
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

              {mode === "signin" && !forgotPw && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPw(true);
                    setResetSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Forgot password?
                </button>
              )}

              {mode === "signin" && (
                <div id="auth-captcha" ref={captchaRef} className="flex justify-center" />
              )}

              {mode === "signup" && password && (
                <div className="animate-checklist-drop space-y-2 rounded-md border border-border/60 bg-neutral-900/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Password requirements</p>
                  <PasswordPolicyChecklist password={password} />
                </div>
              )}

              <button
                disabled={
                  busy ||
                  (mode === "signin" && !captchaVerified) ||
                  (mode === "signup" && !passwordMeetsPolicy(password))
                }
                className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}

          {popupBlocked && (
            <div className="mt-4 rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              Popup was blocked. Please <strong>allow popups for this site</strong> and try again,
              or sign in with email and password.
            </div>
          )}

          {!forgotPw && (
            <>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> OR{" "}
                <div className="h-px flex-1 bg-border" />
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}
