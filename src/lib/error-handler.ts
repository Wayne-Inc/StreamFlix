/**
 * Error handler utility for API routes
 */

export interface ErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}

export function createErrorResponse(
  error: unknown,
  status: number = 500,
  code?: string
): Response {
  // Keep full error details on the server for debugging, but never expose them to clients.
  console.error("API error response:", error);

  const response: ErrorResponse = {
    ok: false,
    error: "Internal server error",
    ...(code ? { code } : {}),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}