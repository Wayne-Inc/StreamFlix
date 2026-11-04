import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/server/server-auth";
import { getAdminDb, revokeRefreshTokens } from "@/server/firebase-admin";
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handler";

export const Route = createFileRoute("/api/revoke-other-sessions")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Verify session via same-origin cookie (no CORS preflight)
          const user = await requireAuth(request);

          const body = await request.json();
          const { currentDeviceId } = body as { currentDeviceId?: string };

          if (!currentDeviceId) {
            return new Response(
              JSON.stringify({ ok: false, error: "Missing currentDeviceId" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Revoke all refresh tokens (Firebase Admin SDK limitation)
          await revokeRefreshTokens(user.uid);

          const adminDb = getAdminDb();
          if (adminDb) {
            // Delete all device records except the current one
            const devicesQuery = adminDb.collection("user_devices").where("user_id", "==", user.uid);
            const devicesSnapshot = await devicesQuery.get();
            if (!devicesSnapshot.empty) {
              const batch = adminDb.batch();
              devicesSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const deviceData = doc.data();
                if (deviceData.device_id !== currentDeviceId) {
                  batch.delete(doc.ref);
                }
              });
              await batch.commit();
            }

            // Delete all FCM tokens except the current device
            const fcmQuery = adminDb.collection("fcm_tokens").where("user_id", "==", user.uid);
            const fcmSnapshot = await fcmQuery.get();
            if (!fcmSnapshot.empty) {
              const batch = adminDb.batch();
              fcmSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const fcmData = doc.data();
                if (fcmData.device_id !== currentDeviceId) {
                  batch.delete(doc.ref);
                }
              });
              await batch.commit();
            }
          }

          return createSuccessResponse({
            message: "Signed out of all other devices",
          });
        } catch (err) {
          if (err instanceof Response) return err;
          return createErrorResponse(err, 500);
        }
      },
    },
  },
});
