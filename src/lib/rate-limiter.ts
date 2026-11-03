/**
 * Rate limiter utility for API routes
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export async function rateLimiter(
  request: Request,
  options: {
    max: number;
    windowMs: number;
    key?: string;
  } = { max: 100, windowMs: 60000 }
): Promise<RateLimitResult> {
  const key = options.key || getClientKey(request);
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Clean up old entries
  for (const [k, v] of store.entries()) {
    if (v.resetTime < now) {
      store.delete(k);
    }
  }

  const entry = store.get(key) || { count: 0, resetTime: now + options.windowMs };
  entry.count++;
  store.set(key, entry);

  const allowed = entry.count <= options.max;
  const remaining = Math.max(0, options.max - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getClientKey(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  // Fallback to a default key
  return "unknown";
}

// Specific rate limiter for AI endpoints
export async function aiRateLimiter(request: Request): Promise<RateLimitResult> {
  return rateLimiter(request, {
    max: 20,
    windowMs: 60000, // 20 requests per minute
    key: `ai:${getClientKey(request)}`,
  });
}