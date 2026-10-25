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
  const message = error instanceof Error ? error.message : String(error);

  const response: ErrorResponse = {
    ok: false,
    error: message,
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