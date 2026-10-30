import { createFileRoute } from "@tanstack/react-router";
import { getServerSession } from "@/server/server-auth";
import { SignJWT } from "jose";

const PRODUCTBRIDGE_SECRET = new TextEncoder().encode(
  process.env.PRODUCTBRIDGE_SECRET_KEY || "2b65430780af87a26ff12e92a406c5a05d938c9629ce3036feb9b93cf5917cd4"
);

export const Route = createFileRoute("/api/productbridge-token")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const session = await getServerSession();

          if (!session?.user) {
            return new Response(
              JSON.stringify({ ok: false, error: "Not authenticated" }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const user = session.user;

          // Generate JWT token for ProductBridge
          const token = await new SignJWT({
            email: user.email,
            name: user.displayName || user.email?.split("@")[0] || "User",
            sub: user.uid,
            avatar_url: user.photoURL || undefined,
            // User segmentation fields
            customer_status: "active",
            external_user_id: user.uid,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(PRODUCTBRIDGE_SECRET);

          return new Response(
            JSON.stringify({ ok: true, token }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          console.error("ProductBridge token generation error:", err);
          return new Response(
            JSON.stringify({ ok: false, error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});