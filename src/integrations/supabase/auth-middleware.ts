import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { adminAuth } from "@/lib/firebase.server";

export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No valid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded?.uid) {
      throw new Error("Unauthorized: Invalid token");
    }

    return next({
      context: {
        userId: decoded.uid,
        claims: decoded,
      },
    });
  },
);
