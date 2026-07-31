import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink, signOut } from "firebase/auth";
import { deleteAccount } from "@/lib/api/account.server";
import { Logo } from "@/components/streamflix/Logo";
import heroImg from "@/assets/hero-1.jpg";

export const Route = createFileRoute("/delete-account")({
  ssr: false,
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "deleting" | "done" | "error">("checking");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const link = window.location.href;

    if (!isSignInWithEmailLink(auth, link)) {
      setMsg(
        "Invalid or expired confirmation link. Please request a new one from your account settings.",
      );
      setStatus("error");
      return;
    }

    let email = window.localStorage.getItem("emailForDelete");
    if (!email) {
      const sp = new URLSearchParams(window.location.search);
      email = sp.get("email");
    }
    if (!email) {
      setMsg("Could not verify your email. Please request a new confirmation link.");
      setStatus("error");
      return;
    }

    setStatus("deleting");

    signInWithEmailLink(auth, email, link)
      .then(async (cred) => {
        try {
          await deleteAccount();
          await signOut(auth);
          window.localStorage.removeItem("emailForDelete");
          setStatus("done");
        } catch (err: any) {
          setMsg(err?.message ?? "Failed to delete account.");
          setStatus("error");
        }
      })
      .catch((err: any) => {
        setMsg(err?.message ?? "Failed to verify your identity.");
        setStatus("error");
      });
  }, []);

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
            {status === "checking" && "Confirming…"}
            {status === "deleting" && "Deleting Account…"}
            {status === "done" && "Account Deleted"}
            {status === "error" && "Error"}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {status === "checking" && "Verifying your confirmation link…"}
            {status === "deleting" && "Your account is being deleted. Please wait…"}
            {status === "done" &&
              "Your StreamFlix account has been permanently deleted. We're sorry to see you go."}
            {status === "error" && msg}
          </p>
          {(status === "done" || status === "error") && (
            <p className="mt-6">
              <Link to="/" className="text-sm text-foreground hover:underline">
                ← Back to home
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
