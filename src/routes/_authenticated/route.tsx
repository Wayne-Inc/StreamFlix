import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function waitForUser(): Promise<typeof auth.currentUser> {
  // If Firebase Auth already has a user (e.g., persisted session), return immediately
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  // Otherwise wait for onAuthStateChanged to fire with a non-null user
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // Timeout: resolve with current user (may be null if not logged in)
        resolve(auth.currentUser);
      }
    }, 3000);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user !== null) {
        // Got a real user - resolve immediately
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          unsub();
          resolve(user);
        }
      }
      // If user === null, keep waiting (don't resolve yet)
    });
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Trust server-side auth: if sf:auth flag exists, the middleware already validated the session cookie
    const hasServerAuth = typeof window !== "undefined" && localStorage.getItem("sf:auth") === "1";

    const user = await waitForUser();

    // Only redirect to /auth if BOTH server auth flag is missing AND Firebase Auth has no user
    if (!hasServerAuth && !user) {
      throw redirect({ to: "/auth" });
    }

    let pending = false;
    try {
      pending = localStorage.getItem("sf:upgrade_password") === "1";
    } catch {}
    if (pending && location.pathname !== "/force-password") {
      throw redirect({ to: "/force-password" });
    }
    return { user };
  },
  component: () => <Outlet />,
});
