export async function requestActionEmail(
  kind: "verifyEmail" | "resetPassword",
  options: { email?: string; idToken?: string },
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.idToken) headers.Authorization = `Bearer ${options.idToken}`;
  const res = await fetch("/api/email/action", {
    method: "POST",
    headers,
    body: JSON.stringify({ kind, email: options.email }),
  });
  if (res.ok) return;
  let message = "Failed to send the email. Please try again.";
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error) message = data.error;
  } catch {
    // fall back to the generic message
  }
  throw new Error(message);
}
