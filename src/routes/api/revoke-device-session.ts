import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/server-auth";
import { getAdminDb, revokeRefreshTokens } from "@/server/firebase-admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handler";

export const Route = createFileRoute("/api/revoke-device-session")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Verify session via same-origin cookie (no CORS preflight)
          const user = await requireAuth(request);

          const body = await request.json();
          const { deviceId } = body as { deviceId?: string };

          if (!deviceId) {
            return new Response(
              JSON.stringify({ ok: false, error: "Missing deviceId" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Revoke all refresh tokens (Firebase Admin SDK limitation - can't target specific tokens)
          await revokeRefreshTokens(user.uid);

          // Delete the specific device record if it belongs to this user
          const adminDb = getAdminDb();
          if (adminDb) {
            const deviceRef = adminDb.collection("user_devices").doc(deviceId);
            const deviceSnap = await deviceRef.get();
            if (deviceSnap.exists) {
              const deviceData = deviceSnap.data();
              if (deviceData?.user_id === user.uid) {
                await deviceRef.delete();
              }
            }

            // Delete FCM token for this device
            const fcmQuery = adminDb
              .collection("fcm_tokens")
              .where("user_id", "==", user.uid)
              .where("device_id", "==", deviceId);
            const fcmSnapshot = await fcmQuery.get();
            const batch = adminDb.batch();
            fcmSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(doc.ref));
            await batch.commit();
          }

          return createSuccessResponse({ message: "Device session revoked" });
        } catch (err) {
          if (err instanceof Response) return err;
          return createErrorResponse(err, 500);
        }
      },
    },
  },
});
