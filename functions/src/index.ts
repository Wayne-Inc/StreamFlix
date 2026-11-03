import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Callable function to revoke all refresh tokens for the current user.
 * This forces the user to re-authenticate on all devices.
 * Also cleans up the device registry in Firestore.
 */
export const revokeAllSessions = functions.onCall(
  async (request: functions.CallableRequest<{}>) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functions.HttpsError(
        "unauthenticated",
        "You must be signed in to revoke sessions."
      );
    }

    const uid = request.auth.uid;

    try {
      // Revoke all refresh tokens - this invalidates all sessions
      await admin.auth().revokeRefreshTokens(uid);

      // Clean up device registry in Firestore
      const devicesQuery = db.collection("user_devices").where("user_id", "==", uid);
      const devicesSnapshot = await devicesQuery.get();

      if (!devicesSnapshot.empty) {
        const batch = db.batch();
        devicesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Also clean up FCM tokens for this user
      const fcmQuery = db.collection("fcm_tokens").where("user_id", "==", uid);
      const fcmSnapshot = await fcmQuery.get();

      if (!fcmSnapshot.empty) {
        const batch = db.batch();
        fcmSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      return {
        success: true,
        message: "All sessions have been revoked. You will need to sign in again on all devices.",
      };
    } catch (error) {
      console.error("Error revoking sessions:", error);
      throw new functions.HttpsError(
        "internal",
        "Failed to revoke sessions. Please try again."
      );
    }
  }
);

/**
 * Callable function to revoke all refresh tokens EXCEPT the current device.
 * This requires the current device ID to be passed from the client.
 */
export const revokeOtherSessions = functions.onCall(
  async (request: functions.CallableRequest<{ currentDeviceId?: string }>) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functions.HttpsError(
        "unauthenticated",
        "You must be signed in to revoke sessions."
      );
    }

    const uid = request.auth.uid;
    const currentDeviceId = request.data.currentDeviceId;

    if (!currentDeviceId) {
      throw new functions.HttpsError(
        "invalid-argument",
        "Current device ID is required."
      );
    }

    try {
      // Get all device records for this user
      const devicesQuery = db.collection("user_devices").where("user_id", "==", uid);
      const devicesSnapshot = await devicesQuery.get();

      // Revoke ALL tokens (Firebase Admin SDK limitation - can't selectively revoke)
      await admin.auth().revokeRefreshTokens(uid);

      // Clean up all device records except current
      if (!devicesSnapshot.empty) {
        const batch = db.batch();
        devicesSnapshot.docs.forEach((doc) => {
          const deviceData = doc.data();
          if (deviceData.device_id !== currentDeviceId) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      }

      // Clean up all FCM tokens except current device
      const fcmQuery = db.collection("fcm_tokens").where("user_id", "==", uid);
      const fcmSnapshot = await fcmQuery.get();

      if (!fcmSnapshot.empty) {
        const batch = db.batch();
        fcmSnapshot.docs.forEach((doc) => {
          const fcmData = doc.data();
          if (fcmData.device_id !== currentDeviceId) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      }

      return {
        success: true,
        message: "Signed out of all other devices. You may need to sign in again on those devices.",
      };
    } catch (error) {
      console.error("Error revoking other sessions:", error);
      throw new functions.HttpsError(
        "internal",
        "Failed to revoke other sessions. Please try again."
      );
    }
  }
);

/**
 * Callable function to revoke a specific device's session.
 * This revokes ALL tokens (since we can't target specific ones),
 * but only removes the specific device from the registry.
 */
export const revokeDeviceSession = functions.onCall(
  async (request: functions.CallableRequest<{ deviceId: string }>) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functions.HttpsError(
        "unauthenticated",
        "You must be signed in to revoke sessions."
      );
    }

    const uid = request.auth.uid;
    const { deviceId } = request.data;

    if (!deviceId) {
      throw new functions.HttpsError(
        "invalid-argument",
        "Device ID is required."
      );
    }

    try {
      // Revoke ALL tokens (Firebase Admin SDK limitation)
      await admin.auth().revokeRefreshTokens(uid);

      // Clean up the specific device record
      const deviceRef = db.collection("user_devices").doc(deviceId);
      const deviceSnap = await deviceRef.get();

      const deviceData = deviceSnap.data();
      if (deviceSnap.exists && deviceData && deviceData.user_id === uid) {
        await deviceRef.delete();
      }

      // Also clean up FCM token for this device
      const fcmQuery = db.collection("fcm_tokens")
        .where("user_id", "==", uid)
        .where("device_id", "==", deviceId);
      const fcmSnapshot = await fcmQuery.get();

      if (!fcmSnapshot.empty) {
        const batch = db.batch();
        fcmSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      return {
        success: true,
        message: "Device session revoked. Note: All sessions were revoked due to Firebase limitations.",
      };
    } catch (error) {
      console.error("Error revoking device session:", error);
      throw new functions.HttpsError(
        "internal",
        "Failed to revoke device session. Please try again."
      );
    }
  }
);