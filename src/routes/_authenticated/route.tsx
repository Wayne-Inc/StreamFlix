import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function waitForUser(): Promise<typeof auth.currentUser> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await waitForUser();
    if (!user) {
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
