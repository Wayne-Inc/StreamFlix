import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminAuth, adminDb } from "@/lib/firebase.server";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const batch = adminDb.batch();
    batch.delete(adminDb.collection("profiles").doc(userId));
    const devices = await adminDb.collection("user_devices").where("user_id", "==", userId).get();
    devices.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    await adminAuth.deleteUser(userId);

    return { success: true };
  });

export type DeleteAccountResponse = Awaited<ReturnType<typeof deleteAccount>>;
