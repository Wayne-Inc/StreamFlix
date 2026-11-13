/**
 * AniFlix is the companion anime app. It is deployed separately but shares the
 * same Firebase project (streamflix-e91bc) as StreamFlix, so an account created
 * on either app can be used on both.
 */
export const ANIFLIX_ORIGIN = "https://ani.streamflix.dpdns.org";

/**
 * Same-origin endpoint that mints a short-lived login handoff token and
 * redirects to AniFlix. Using a redirect (instead of linking to AniFlix
 * directly) keeps the token out of the navbar markup, works with
 * middle-click/new-tab, and avoids popup blockers.
 */
export const ANIFLIX_HANDOFF_PATH = "/api/aniflix-handoff";

/** Name of the URL fragment that carries the handoff token to AniFlix. */
export const ANIFLIX_HANDOFF_HASH_PARAM = "sf_token";

/**
 * Where the navbar "Anime" link should point. Kids profiles deliberately skip
 * the handoff: AniFlix has no PIN gate of its own, so the Anime link must not
 * silently sign a kids profile into a full account that bypasses StreamFlix's
 * parental lock.
 */
export function aniflixHref(options?: { kids?: boolean }): string {
  return options?.kids ? `${ANIFLIX_HANDOFF_PATH}?skip=1` : ANIFLIX_HANDOFF_PATH;
}
