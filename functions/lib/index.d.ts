import * as functions from "firebase-functions/v2/https";
/**
 * Callable function to revoke all refresh tokens for the current user.
 * This forces the user to re-authenticate on all devices.
 * Also cleans up the device registry in Firestore.
 */
export declare const revokeAllSessions: functions.CallableFunction<{}, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * Callable function to revoke all refresh tokens EXCEPT the current device.
 * This requires the current device ID to be passed from the client.
 */
export declare const revokeOtherSessions: functions.CallableFunction<{
    currentDeviceId?: string;
}, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * Callable function to revoke a specific device's session.
 * This revokes ALL tokens (since we can't target specific ones),
 * but only removes the specific device from the registry.
 */
export declare const revokeDeviceSession: functions.CallableFunction<{
    deviceId: string;
}, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map