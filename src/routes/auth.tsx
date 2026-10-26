import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { auth } from "@/lib/firebase";
import { passwordMeetsPolicy } from "@/lib/password";
import { PasswordPolicyChecklist } from "@/components/streamflix/PasswordPolicyChecklist";
import { PasswordStrengthMeter } from "@/components/streamflix/PasswordStrengthMeter";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithCredential,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  type AuthCredential,
  type User,
} from "firebase/auth";
import heroImg from "@/assets/hero-1.jpg";
import { TOS_VERSION } from "@/routes/tos";
import { PRIVACY_VERSION } from "@/routes/privacy-policy";
import { setUserLegalVersions } from "@/lib/user-versions";

const LAST_SIGN_IN_METHOD_KEY = "sf:lastSignInMethod";
type SignInMethod = "email" | "google" | "github";
type LinkProvider = "google" | "github";

const providerLabel = (p: LinkProvider) => (p === "google" ? "Google" : "GitHub");

const FEDERATED_PROVIDERS: Record<string, LinkProvider> = {
  "google.com": "google",
  "github.com": "github",
};

// The error Firebase raises for `auth/account-exists-with-different-credential`.
type AuthLinkError = Error & {
  code?: string;
  email?: string | null;
  credential?: AuthCredential;
};

function asAuthError(e: unknown): AuthLinkError {
  if (e && typeof e === "object") return e as AuthLinkError;
  return new Error(typeof e === "string" ? e : "Unknown error");
}

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
  const [linkRequest, setLinkRequest] = useState<{
    credential: AuthCredential;
    email: string;
    provider: LinkProvider;
  } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkShowPw, setLinkShowPw] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [lastSignInMethod, setLastSignInMethod] = useState<SignInMethod | null>(() => {
    try {
      const saved = localStorage.getItem(LAST_SIGN_IN_METHOD_KEY);
      return saved === "email" || saved === "google" || saved === "github" ? saved : null;
    } catch {
      return null;
    }
  });

  const rememberSignInMethod = (method: SignInMethod) => {
    setLastSignInMethod(method);
    try {
      localStorage.setItem(LAST_SIGN_IN_METHOD_KEY, method);
    } catch {}
  };

  const markSignedIn = () => {
    try {
      localStorage.setItem("sf:auth", "1");
    } catch (err) {
      console.warn("Could not persist the signed-in flag", err);
    }
  };

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
      if (user && user.emailVerified && !pending && !onUpgrade) {
        try {
          localStorage.setItem("sf:auth", "1");
        } catch {}
        navigate({ to: "/profiles" });
      }
    });
    return () => unsub();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit()) return;
    setBusy(true);
    setVerifyMsg("");
    try {
      if (mode === "signin") {
        const { executeTurnstile } = await import("@/lib/turnstile");
        const token = await executeTurnstile("signin");
        if (!token) {
          toast.error("Verification failed. Please try again.");
          setBusy(false);
          return;
        }
        const verifyRes = await fetch("/api/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "signin" }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.ok) {
          toast.error("Verification failed. Please try again.");
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

        // Create server session cookie for SSR auth
        const idToken = await cred.user.getIdToken();
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        rememberSignInMethod("email");
        try {
          localStorage.setItem("sf:auth", "1");
        } catch {}
        // Set user's accepted legal versions
        try {
          await setUserLegalVersions(cred.user.uid, {
            tosVersion: TOS_VERSION,
            privacyVersion: PRIVACY_VERSION,
          });
        } catch (e) {
          console.warn("Could not set user legal versions", e);
        }
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
        const { executeTurnstile } = await import("@/lib/turnstile");
        const token = await executeTurnstile("signup");
        if (!token) {
          toast.error("Verification failed. Please try again.");
          setBusy(false);
          return;
        }
        const verifyRes = await fetch("/api/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "signup" }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.ok) {
          toast.error("Verification failed. Please try again.");
          setBusy(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateFirebaseProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
        // Set user's accepted legal versions
        try {
          await setUserLegalVersions(cred.user.uid, {
            tosVersion: TOS_VERSION,
            privacyVersion: PRIVACY_VERSION,
          });
        } catch (e) {
          console.warn("Could not set user legal versions", e);
        }
        setVerifyMsg(
          `Verification email sent to ${email}. Please check your inbox (and spam folder) and then sign in.`,
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
      toast.success("Verification email resent. Check your inbox and spam folder.");
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
      toast.success("Password reset email sent. Check your inbox and spam folder.");
    } catch (err: any) {
      const msg = err?.code
        ? err.code.replace("auth/", "").replace(/-/g, " ")
        : (err?.message ?? "Failed to send reset email.");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const completeLink = async (
    credential: AuthCredential,
    provider: LinkProvider,
    signedInUser: User,
  ) => {
    await linkWithCredential(signedInUser, credential);
    rememberSignInMethod(provider);
    markSignedIn();
    setLinkRequest(null);
    setLinkPassword("");

    // Create server session cookie for SSR auth
    const idToken = await signedInUser.getIdToken();
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    toast.success(`Accounts linked — signed in with ${providerLabel(provider)}.`);
    navigate({ to: "/profiles" });
  };

  // The provider sign-in failed because an account already exists for that
  // email. Work out how to link it instead of guessing a password.
  const startLinking = async (err: AuthLinkError, provider: LinkProvider) => {
    const credential = err.credential;
    const mail = err.email ?? "";
    if (!credential || !mail) {
      toast.error(
        `${providerLabel(provider)} sign-in could not be linked: ${err.message ?? "the existing account could not be identified"}. Sign in with email and password instead.`,
      );
      return;
    }

    let methods: string[] = [];
    try {
      methods = await fetchSignInMethodsForEmail(auth, mail);
    } catch {
      toast.error(
        "Could not look up the existing account for this email. Sign in with email and password instead.",
      );
      return;
    }

    if (methods.includes("password")) {
      setLinkRequest({ credential, email: mail, provider });
      setLinkPassword("");
      return;
    }

    const existing = methods.map((m) => FEDERATED_PROVIDERS[m]).find((m): m is LinkProvider => !!m);
    if (!existing) {
      toast.error(
        `An account already exists for ${mail}`,
      );
      return;
    }

    // Re-authenticate with the provider that owns the existing account, then link.
    try {
      const result =
        existing === "google"
          ? await signInWithPopup(auth, new GoogleAuthProvider())
          : await signInWithPopup(auth, new GithubAuthProvider());
      await completeLink(credential, provider, result.user);
    } catch (linkErr) {
      const failure = asAuthError(linkErr);
      if (failure.code === "auth/popup-closed-by-user") return;
      toast.error(
        `Could not link ${providerLabel(provider)}: ${failure.message || "linking failed"}. Nothing was changed on your account.`,
      );
    }
  };

  const onSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkRequest) return;
    if (!linkPassword) {
      toast.error("Enter the password for the existing account.");
      return;
    }
    setLinkBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, linkRequest.email, linkPassword);
      await completeLink(linkRequest.credential, linkRequest.provider, cred.user);
    } catch (err) {
      const failure = asAuthError(err);
      if (
        failure.code === "auth/invalid-credential" ||
        failure.code === "auth/wrong-password" ||
        failure.code === "auth/user-not-found"
      ) {
        toast.error("Incorrect password for that account.");
      } else {
        toast.error(
          `Could not link the account: ${failure.message || "linking failed"}. Nothing was changed on your account.`,
        );
      }
    } finally {
      setLinkBusy(false);
    }
  };

  const cancelLink = () => {
    setLinkRequest(null);
    setLinkPassword("");
  };

  const onGoogle = async () => {
    setBusy(true);
    setPopupBlocked(false);

    // Verify Turnstile CAPTCHA before allowing OAuth popup
    const { executeTurnstile } = await import("@/lib/turnstile");
    const token = await executeTurnstile("google-signin");
    if (!token) {
      toast.error("Verification failed. Please try again.");
      setBusy(false);
      return;
    }
    const verifyRes = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "google-signin" }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.ok) {
      toast.error("Verification failed. Please try again.");
      setBusy(false);
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      rememberSignInMethod("google");
      try {
        localStorage.setItem("sf:auth", "1");
      } catch {}
      // Create server session cookie for SSR auth
      const idToken = await userCred.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      // Set user's accepted legal versions
      try {
        await setUserLegalVersions(userCred.user.uid, {
          tosVersion: TOS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        });
      } catch (e) {
        console.warn("Could not set user legal versions", e);
      }
      toast.success("Signed in with Google.");
      navigate({ to: "/profiles" });
    } catch (err: any) {
      // Handle account exists with different credential
      if (err?.code === "auth/account-exists-with-different-credential") {
        await startLinking(err, "google");
        setBusy(false);
        return;
      }

      if (err?.code === "auth/popup-blocked") {
        setPopupBlocked(true);
      } else if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message ?? "Google sign-in failed");
      }
      setBusy(false);
    }
  };

  const onGitHub = async () => {
    setBusy(true);

    // Verify Turnstile CAPTCHA before allowing OAuth popup
    const { executeTurnstile } = await import("@/lib/turnstile");
    const token = await executeTurnstile("github-signin");
    if (!token) {
      toast.error("Verification failed. Please try again.");
      setBusy(false);
      return;
    }
    const verifyRes = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "github-signin" }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.ok) {
      toast.error("Verification failed. Please try again.");
      setBusy(false);
      return;
    }

    // Web: popup flow
    const provider = new GithubAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      rememberSignInMethod("github");
      try {
        localStorage.setItem("sf:auth", "1");
      } catch {}
      // Create server session cookie for SSR auth
      const idToken = await userCred.user.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      // Set user's accepted legal versions
      try {
        await setUserLegalVersions(userCred.user.uid, {
          tosVersion: TOS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        });
      } catch (e) {
        console.warn("Could not set user legal versions", e);
      }
      toast.success("Signed in with GitHub.");
      navigate({ to: "/profiles" });
    } catch (err: any) {
      // Handle account exists with different credential
      if (err?.code === "auth/account-exists-with-different-credential") {
        await startLinking(err, "github");
        setBusy(false);
        return;
      }

      if (err?.code === "auth/popup-blocked") {
        setPopupBlocked(true);
      } else if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message ?? "GitHub sign-in failed");
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
          {linkRequest ? (
            <div className="mt-6 space-y-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
              <div>
                <p className="text-sm font-semibold text-amber-400">
                  An account already exists for {linkRequest.email}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the password for that account to link it with{" "}
                  {providerLabel(linkRequest.provider)}. Nothing is changed until the link succeeds.
                </p>
              </div>
              <form className="space-y-3" onSubmit={onSubmitLink}>
                <div className="relative">
                  <input
                    required
                    type={linkShowPw ? "text" : "password"}
                    placeholder="Existing account password"
                    aria-label="Existing account password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded bg-neutral-800 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setLinkShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password"
                  >
                    {linkShowPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <button
                  disabled={linkBusy}
                  className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {linkBusy
                    ? "Linking…"
                    : `Link and sign in with ${providerLabel(linkRequest.provider)}`}
                </button>
                <button
                  type="button"
                  onClick={cancelLink}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : forgotPw ? (
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

              {mode === "signup" && password && (
                <div className="animate-checklist-drop space-y-2 rounded-md border border-border/60 bg-neutral-900/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Password strength</p>
                  <PasswordStrengthMeter password={password} />
                  <p className="pt-1 text-xs font-medium text-muted-foreground">
                    Password requirements
                  </p>
                  <PasswordPolicyChecklist password={password} />
                </div>
              )}

              {mode === "signup" && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 text-center">
                  By creating an account, you agree to our{" "}
                  <Link to="/tos" className="underline hover:text-amber-300 transition-colors font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="underline hover:text-amber-300 transition-colors font-medium">
                    Privacy Policy
                  </Link>
                  .
                </div>
              )}

              <button
                disabled={busy || (mode === "signup" && !passwordMeetsPolicy(password))}
                className={`w-full rounded border py-3 font-semibold disabled:opacity-60 ${mode === "signin" && lastSignInMethod === "email" ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 hover:bg-primary/20 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" : "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"}`}
              >
                {busy
                  ? "Please wait…"
                  : mode === "signin"
                    ? `Sign In${lastSignInMethod === "email" ? " · Last used" : ""}`
                    : "Create Account"}
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
                className={`mt-4 w-full rounded border py-3 font-semibold disabled:opacity-60 ${mode === "signin" && lastSignInMethod === "google" ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 hover:bg-primary/20 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" : "border-transparent bg-foreground/10 text-foreground hover:bg-foreground/20 active:bg-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"}`}
              >
                Continue with Google
                {mode === "signin" && lastSignInMethod === "google" ? " · Last used" : ""}
              </button>
              <button
                onClick={onGitHub}
                disabled={busy}
                className={`mt-3 w-full rounded border py-3 font-semibold disabled:opacity-60 ${mode === "signin" && lastSignInMethod === "github" ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 hover:bg-primary/20 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" : "border-transparent bg-foreground/10 text-foreground hover:bg-foreground/20 active:bg-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"}`}
              >
                Continue with GitHub
                {mode === "signin" && lastSignInMethod === "github" ? " · Last used" : ""}
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
