import { authenticateRequest } from "./server-auth";
import { redirect } from "@tanstack/react-router";

export async function checkRootAuth(request: Request): Promise<void> {
  const serverUser = await authenticateRequest(request);
  if (serverUser) {
    throw redirect({ to: "/profiles" });
  }
}