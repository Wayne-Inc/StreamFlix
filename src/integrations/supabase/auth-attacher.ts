import { createMiddleware } from "@tanstack/react-start";
import { auth } from "@/lib/firebase";

export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return next({
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    return next({ headers: {} });
  },
);
