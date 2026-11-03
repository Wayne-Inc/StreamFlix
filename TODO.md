# StreamFlix To-Do List

## All Feature Tasks Completed

## Security Alerts - Completed
- [x] Leaked Google API keys - Already addressed: firebase.ts uses env vars, firebase-messaging-sw.js generated from env vars at build time (static file has empty strings), no android/google-services.json exists
- [x] minimatch DOS via globparts amplification - Updated to ^11.0.1 via package.json overrides
- [x] uuid missing buffer bounds check - Updated top-level uuid to 11.1.1 in functions/package-lock.json
- [x] Glob AbortSignal cancellation bypass - Updated to ^14.0.2 via package.json overrides
- [x] Incomplete URL substring sanitization (profiles.tsx, Navbar.tsx) - High - Replaced `.includes("image.tmdb.org")` with proper URL parsing via `isTmdbImageUrl()` helper; added `isSafeImageUrl()` validation for userData.photoURL

## Root npm audit: 0 vulnerabilities
## Functions npm audit: remaining vulns in nested dev/test deps require breaking changes (not in PROMPT.txt scope)

## Not to be implemented now
- CLICKING-SEASONS-OPENS-A-SEASON-INFO-PAGE
- CLICKING-EPISODES-OPENS-A-EPISODE-INFO-PAGE
- REMOVE-THE-RANDOM-SECTIONS-IN-MOVIE-INFO-PAGES-WHEN-THE-GENRE-SECTIONS-UNDER-MOVIE-INFO-PAGES-ARE-LESS-THAN-3
- ADD-A-BACDROPS-AND-POSTER-SECTION-IN-THE-MOVIE-INFO-PAGE.
- IF-A-MOVIE-HAS-COLLECTIONS-OF-OTHER-MOVIES-SHOW-THE-COLLECTION.RETRIEVE-FROM-TMDB.
- SHOW-PRODUCTION-COMPANIES-OF-THE-MOVIES-IN-THE-MOVIE-INFO-PAGE.
- REMOVE-TRAILER-BUTTON
- ADD-A-TRAILER-SECTION-WHERE-YOU-CAN-VIEW-MULTIPLE-TRAILERS.
