// User-facing copy for every StreamFlix AI failure.
//
// Rules for these strings:
// - They are shown to the visitor verbatim, so they must never blame the visitor.
// - They must never leak server details (env var names, upstream payloads, stacks).
// - They must say what happened, that it is on our side, and what to do next.

export const AI_ERROR_MESSAGES = {
  notConfigured:
    "StreamFlix AI isn't switched on yet. That's a setup issue on our side, not a problem with your request. Please try again in a few minutes.",
  unavailable:
    "StreamFlix AI can't reach our AI provider right now. That's on us, not you. Please try again in a moment.",
  empty: "StreamFlix AI sent back an empty reply. That's a hiccup on our side. Please try again.",
  rateLimit:
    "You've made a lot of requests in a short time, so the assistant paused to catch its breath. Wait a minute and try again. Your request was fine.",
  auth: "Your session expired, so we couldn't verify your account. Sign in again and try once more. Your request was fine.",
  providerAuth:
    "StreamFlix AI's connection to our AI provider expired. That's a setup issue on our side. Please try again in a few minutes.",
  catalog:
    "We couldn't load the movie catalog just now. That's a temporary problem on our side. Please try again shortly.",
  titleDetails:
    "We couldn't load the details for that title just now. That's on our side. Please try again shortly.",
  needsTitle: "Pick a title first and I'll summarize it for you.",
  network:
    "We couldn't reach StreamFlix AI. Check your connection and try again. Your request is fine.",
  unknown: "StreamFlix AI hit a snag on our side. Your request was fine. Please try again.",
} as const;

export type AiErrorKind = keyof typeof AI_ERROR_MESSAGES;

const SAFE_MESSAGES: string[] = Object.values(AI_ERROR_MESSAGES);

const NETWORK_PATTERN =
  /failed to fetch|networkerror|network request failed|load failed|err_connection|err_network/i;

/**
 * Turns any thrown value into a safe, visitor-facing message.
 * Unknown errors never leak their original text.
 */
export function aiErrorMessage(cause: unknown): string {
  const raw = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
  if (raw) {
    const safe = SAFE_MESSAGES.find((message) => raw.includes(message));
    if (safe) return safe;
    if (NETWORK_PATTERN.test(raw)) return AI_ERROR_MESSAGES.network;
  }
  return AI_ERROR_MESSAGES.unknown;
}
