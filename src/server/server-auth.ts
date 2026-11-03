import { verifySessionCookie, isAdminInitialized, createSessionCookie } from "./firebase-admin";

const SESSION_COOKIE_NAME = "__session";

export interface ServerUser {
  uid: string;
  email: string;
  claims: Record<string, unknown>;
}

export interface AuthContext {
  user: ServerUser | null;
}

/**
 * Extracts the session cookie from the request headers
 */
function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return cookie.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }
  return null;
}

/**
 * Sets the session cookie in the response headers
 */
export function setSessionCookie(response: Response, sessionCookie: string, maxAge = 60 * 60 * 24 * 14): void {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${sessionCookie}`,
    "HttpOnly",
    isProduction ? "Secure" : "",  // Only Secure on HTTPS (production)
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    "Path=/",
  ].filter(Boolean);

  response.headers.append("Set-Cookie", cookieParts.join("; "));
}

/**
 * Clears the session cookie
 */
export function clearSessionCookie(response: Response): void {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    "HttpOnly",
    isProduction ? "Secure" : "",  // Only Secure on HTTPS (production)
    "SameSite=Lax",
    "Max-Age=0",
    "Path=/",
  ].filter(Boolean);

  response.headers.append("Set-Cookie", cookieParts.join("; "));
}

/**
 * Middleware function to authenticate a request on the server
 * Returns the user object if authenticated, null otherwise
 */
export async function authenticateRequest(request: Request): Promise<ServerUser | null> {
  if (!isAdminInitialized()) return null;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) return null;

  return verifySessionCookie(sessionCookie);
}

/**
 * Creates an auth context for use in TanStack Router loaders
 */
export async function createAuthContext(request: Request): Promise<AuthContext> {
  const user = await authenticateRequest(request);
  return { user };
}

/**
 * H3/Nitro event handler wrapper for authentication
 * Use this in server routes that need auth
 */
export async function requireAuth(request: Request): Promise<ServerUser> {
  const user = await authenticateRequest(request);
  if (!user) {
    throw new Response(null, { status: 401, statusText: "Unauthorized" });
  }
  return user;
}

/**
 * Optional auth - returns user if available, doesn't throw
 */
export async function optionalAuth(request: Request): Promise<ServerUser | null> {
  return await authenticateRequest(request);
}

// Re-export from firebase-admin
export { isAdminInitialized, createSessionCookie } from "./firebase-admin";