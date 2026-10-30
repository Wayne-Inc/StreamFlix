import { authenticateRequest } from "./server-auth";
import { redirect } from "@tanstack/react-router";

export async function checkAuthenticatedAuth(request: Request, location: { pathname: string }): Promise<void> {
  const serverUser = await authenticateRequest(request);
  if (!serverUser) {
    throw redirect({ to: "/auth", search: { email: "" } });
  }
  // Check for password upgrade requirement - this is client-side only (localStorage)
  // Server-side we can't check localStorage, but the client-side fallback will handle it
  return;
}