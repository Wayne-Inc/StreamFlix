import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/server/server-auth";
import { SignJWT } from "jose";

export const Route = createFileRoute("/api/productbridge-token")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Read secret at request time (env vars may not be loaded at module level)
          const secretKey = process.env.PRODUCTBRIDGE_SECRET_KEY;
          if (!secretKey) {
            console.error("PRODUCTBRIDGE_SECRET_KEY environment variable not set");
            return new Response(
              JSON.stringify({ ok: false, error: "Server configuration error" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const PRODUCTBRIDGE_SECRET = new TextEncoder().encode(secretKey);

          const user = await authenticateRequest(request);

          if (!user) {
            return new Response(
              JSON.stringify({ ok: false, error: "Not authenticated" }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Generate JWT token for ProductBridge
          const token = await new SignJWT({
            email: user.email,
            name: user.email?.split("@")[0] || "User",
            sub: user.uid,
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