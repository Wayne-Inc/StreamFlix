# StreamFlix

A Netflix-style streaming web app built with **React 19**, **TanStack Start**, **TypeScript**,
**Firebase**, and **TMDB**. Server-rendered authentication, up to five profiles per account, synced
watch progress, an AI assistant, and installable PWA support.

**Live demo:** [streamflix.dpdns.org](https://streamflix.dpdns.org) · **Version:** 2.5.0

---

## What is StreamFlix?

StreamFlix is a streaming front end: it surfaces movies and TV shows from TMDB, plays them through
third-party embed servers, and keeps accounts, profiles, lists, and progress in Firebase.

The app hosts no media itself. Playback happens inside third-party players, so stream availability
and in-player ads depend on those providers — StreamFlix never proxies or re-hosts video.

---

## Features

### Discovery

- **Browse** — Top 10 Today, Trending This Week, genre rows, Continue Watching, and a
  personalized **Picked for You** row
- **Search** — typo-tolerant matching (misspellings and transpositions) over movies, TV, and people
- **Explore** — genre landing pages and dedicated person pages
- **New & Coming Soon** — release calendar for upcoming and newly aired titles
- **Detail pages** — cast, seasons and episodes, trailers, age ratings, and share links

### Profiles and personalization

- **Up to five profiles** per account, each with its own avatar, watch history, and list
- **Avatar tools** — TMDB image picker and in-browser cropping
- **PIN protection** — per-profile PINs hashed with PBKDF2-SHA256 (100,000 iterations, per-profile
  salt); only the salted hash is stored, never the PIN itself
- **Kids Mode** — content filtering by genre plus per-profile age-rating limits (G → NC-17,
  TV-Y → TV-MA)
- **Personalized row** — genre-affinity scoring over recent watch history, refreshed as you watch

### Playback and library

- **Multiple embed servers** — choose a source per title; the choice is remembered and the player
  falls back automatically when a source is unavailable
- **Continue Watching** — progress captured every 5 seconds, stored locally and synced to Firestore
- **Watch history** — every title you play, synced across devices
- **My List** — instant optimistic add/remove with background sync
- **TV playback** — season and episode selection, autoplay next episode, and caption track controls
- **Player shell** — Escape to leave, idle screen saver, and a one-time notice that third-party
  players may show ads

### Account and security

- **Server-rendered auth** — session cookie verified before HTML renders, so there is no
  signed-out flash and sessions survive browser restarts
- **Devices** — see signed-in devices and revoke one, several, or all sessions
- **Push notifications** — FCM web push for new releases, plus opt-in upcoming-movie alerts
- **Data controls** — export everything as JSON, or permanently delete the account
- **Account hardening** — email verification, password reset, a password policy meter, and a
  forced password-update route for legacy accounts
- **Bot protection** — optional Cloudflare Turnstile on auth and Firebase App Check (reCAPTCHA
  Enterprise) on Firebase traffic

### Platform

- **PWA** — installable, with a service worker, offline page, and app manifest
- **Offline-tolerant data** — Firestore persistent cache with multi-tab coordination
- **Accessibility** — reduce-motion preference, focus management, semantic landmarks, keyboard
  navigation, and TV-style spatial navigation for remote controls
- **Data saver** — respects the browser Save-Data hint, with a manual toggle
- **Consent-gated analytics** — Google Analytics 4 loads only after consent, using Consent Mode v2
- **SEO** — per-page titles, Open Graph and Twitter cards, generated sitemap, and `robots.txt`

---

## Tech Stack

| Layer           | Choice                                                                          |
| --------------- | ------------------------------------------------------------------------------- |
| UI              | React 19, Tailwind CSS 4, shadcn/ui + Radix primitives, lucide-react            |
| Routing and SSR | TanStack Start + TanStack Router (file-based routes), Nitro for the server      |
| Data fetching   | TanStack Query (server state), server functions via `createServerFn`            |
| Auth            | Firebase Auth (email/password, Google, GitHub) + Admin SDK session cookies      |
| Database        | Cloud Firestore with security rules and offline persistence                     |
| Metadata        | TMDB (search, details, images)                                                  |
| AI assistant    | NVIDIA NIM chat completions (optional, model configurable)                      |
| Push            | Firebase Cloud Messaging (web push)                                             |
| Hosting         | Vercel (Nitro `vercel` preset); Firebase Cloud Functions for session revocation |
| Tooling         | Vite 7, TypeScript 5.8 (strict), ESLint 9, Prettier 3, npm or Bun               |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ Browser                                                              │
│ React 19 · TanStack Router/Start · TanStack Query · Tailwind 4       │
│ Firebase JS SDK: Auth, Firestore, FCM, App Check                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────────────┐
│ Vercel — Nitro server entry (src/server.ts)                          │
│   1. authMiddleware verifies __session via Firebase Admin            │
│   2. TanStack Start SSR handler renders the route                    │
│   3. Route-level API handlers + createServerFn server functions      │
└──────┬────────────────┬────────────────┬─────────────────┬───────────┘
       │                │                │                 │
       ▼                ▼                ▼                 ▼
   TMDB API     Firestore / Auth    NVIDIA NIM        FCM (push)
                   (Admin SDK)      (optional)
```

### External services

| Service                  | Purpose                                               | Required    |
| ------------------------ | ----------------------------------------------------- | ----------- |
| **Firebase**             | Auth, Firestore, App Check, FCM, Cloud Functions      | Yes         |
| **TMDB**                 | Movie/TV metadata, images, search                     | Yes         |
| **Vercel**               | Hosting, serverless SSR, cron                         | Recommended |
| **NVIDIA NIM**           | AI assistant and recommendation chat                  | Optional    |
| **Cloudflare Turnstile** | Bot protection on auth forms                          | Optional    |
| **ProductBridge**        | Signed-in download/store widget                       | Optional    |

### Server-side authentication flow

```
1. Request → Vercel
2. src/server.ts → authMiddleware checks the __session cookie
3. Cookie verified with Firebase Admin verifySessionCookie()
4. Valid?    → continue to the TanStack Start SSR handler
   Missing? → 302 to /auth?redirect=<original path>
5. Sign-in:  client POST /api/session { idToken } → HTTP-only cookie is set
6. Sign-out: client DELETE /api/session → cookie cleared
```

Protected prefixes: `/profiles`, `/browse`, `/watch`, `/explore`, `/search`, `/calendar`,
`/history`, `/mylist`, `/settings`, `/assistant`, `/force-password`. Signed-in visitors who open `/`
are redirected to `/profiles`.

**Key files**

| File                                  | Responsibility                                        |
| ------------------------------------- | ----------------------------------------------------- |
| `src/server.ts`                       | Nitro entry, auth middleware, SSR error page handling |
| `src/server/server-auth.ts`           | Cookie parsing, session verification, helpers         |
| `src/server/firebase-admin.ts`        | Admin SDK init, session cookie create/verify          |
| `src/routes/api/session.ts`           | `POST` create session, `DELETE` clear it              |
| `src/routes/_authenticated/route.tsx` | Client-side guard (defense in depth)                  |

---

## Firestore Data Model

Rules live in `firestore.rules` with a default-deny catch-all at the end.

```
users/{uid}
├── profiles/{profileId}         # active: name, color, kids, avatarUrl, pinHash, contentRatingLimit
└── (legacy subcollections, kept only so account deletion can clean them up)
    continueWatching/ · myList/ · history/ · devices/ · sessions/
    recommendations/ · releaseNotifications/

profiles/{profileId}             # legacy root mirror
user_devices/{deviceId}          # device registry (snake_case; read by Cloud Functions)
sessions/{sessionId}             # playback session log, consent-gated
watch_history/{docId}            # synced watch history
continue_watching/{docId}        # synced progress
my_list/{docId}                  # synced list
fcm_tokens/{token}               # push targets
release_notifications/{docId}    # per-title release alert preferences
vip/{uid}                        # maintainer feature flag
```

Every document is scoped to `request.auth.uid`; profile writes validate field shape and ownership,
not just "is signed in".

---

## Getting Started

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required by Vite 7; the project is developed on Node 24)
- **npm 10+** or **Bun 1.1+**
- A **Firebase project** with Authentication and Firestore enabled
- A **TMDB account** with API credentials ([themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

### 1. Clone and install

```bash
git clone https://github.com/Wayne-Inc/StreamFlix.git
cd StreamFlix
npm install        # or: bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the Firebase web config and TMDB keys. Optional integrations (NVIDIA, Turnstile, App Check,
ProductBridge) can stay blank.

`.env.local` and every other `.env.*` file are gitignored except `.env.example`.

### 3. Firebase setup

1. **Authentication** — enable Email/Password, Google, and GitHub providers
2. **Firestore** — create a database in production mode
3. **App Check** (optional) — register a reCAPTCHA Enterprise site and copy the site key
4. **Service account** — Project settings → Service accounts → generate a new private key
5. Deploy rules:

   ```bash
   npx firebase deploy --only firestore:rules
   ```

   There is no `firestore.indexes.json` in this repo, so `firestore:indexes` is not part of the
   deploy. Add and commit one if you introduce a query that needs a composite index.

### 4. Server-side variables

The Admin SDK needs credentials on the server. For local development put them in `.env.local`; for
production add them in **Vercel → Settings → Environment variables**. See
[Environment Variables](#environment-variables).

### 5. Emulators (optional, recommended for data work)

```bash
npx firebase emulators:start
```

`firebase.json` exposes Auth on `9099`, Firestore on `8080`, Functions on `5001`, and the emulator UI
on `4000`. Opt in from the client with:

```bash
VITE_FIREBASE_EMULATOR="1"
VITE_FIREBASE_EMULATOR_HOST="127.0.0.1"
```

### 6. Run

```bash
npm run dev
# → http://localhost:8080
```

The dev server listens on **8080** (configured in `vite.config.ts`), not 5173.

---

## Environment Variables

Anything prefixed `VITE_` is inlined into the client bundle and is **public**. Never put a secret
behind a `VITE_` name.

### Client (`.env.local`)

| Variable                            | Required    | Description                                            |
| ----------------------------------- | ----------- | ------------------------------------------------------ |
| `VITE_FIREBASE_API_KEY`             | Yes         | Firebase web API key                                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Yes         | `<project>.firebaseapp.com`                            |
| `VITE_FIREBASE_PROJECT_ID`          | Yes         | Firebase project ID                                    |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Yes         | `<project>.firebasestorage.app`                        |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes         | FCM sender ID                                          |
| `VITE_FIREBASE_APP_ID`              | Yes         | Firebase app ID                                        |
| `VITE_FIREBASE_VAPID_KEY`           | No          | FCM web push VAPID key (enables notifications)         |
| `VITE_TMDB_API_KEY`                 | Recommended | TMDB v4 Bearer token for the client-side avatar picker |
| `VITE_TMDB_V3_API_KEY`              | No          | Fallback token if the primary client token is empty    |
| `VITE_SITE_URL`                     | Yes         | Canonical origin for SEO/OG URLs                       |
| `VITE_TURNSTILE_SITE_KEY`           | No          | Cloudflare Turnstile site key                          |
| `VITE_APP_CHECK_SITE_KEY`           | No          | reCAPTCHA Enterprise site key for App Check            |
| `VITE_DISABLE_APP_CHECK`            | No          | Set to `"true"` to skip App Check initialization       |
| `VITE_FIREBASE_EMULATOR`            | No          | Set to `"1"` to use the local emulators                |
| `VITE_FIREBASE_EMULATOR_HOST`       | No          | Emulator host, default `127.0.0.1`                     |

### Server only (Vercel / `.env.local` for dev)

| Variable                   | Required | Description                                                    |
| -------------------------- | -------- | -------------------------------------------------------------- |
| `FIREBASE_CLIENT_EMAIL`    | Yes      | Service account `client_email`                                 |
| `FIREBASE_PRIVATE_KEY`     | Yes      | Service account `private_key` (keep the `\n` escapes)          |
| `FIREBASE_PROJECT_ID`      | No       | Overrides `VITE_FIREBASE_PROJECT_ID` for the Admin SDK         |
| `TMDB_API_KEY`             | Yes      | TMDB v3 key for server-side fetching and `npm run sitemap`     |
| `CRON_SECRET`              | Yes      | Bearer token for `/api/release-notifications-cron`             |
| `TURNSTILE_SECRET_KEY`     | No       | Turnstile secret used by `/api/verify-recaptcha`               |
| `NVIDIA_API_KEY`           | No       | NVIDIA NIM key for the AI assistant                            |
| `NVIDIA_NIM_API_KEY`       | No       | Alternative name for the same key                              |
| `NVIDIA_BASE_URL`          | No       | Defaults to `https://integrate.api.nvidia.com/v1`              |
| `NVIDIA_MODEL`             | No       | Defaults to `nvidia/nemotron-3.5-bolt-e4b`                     |
| `PRODUCTBRIDGE_SECRET_KEY` | No       | HS256 secret for the signed download-widget token              |

> **Dev note:** `vite.config.ts` forwards a whitelist of server variables into `process.env` for the
> dev server (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`,
> and the `NVIDIA_*` keys). If you add a new server-only variable and it reads as empty locally, add
> it to that list.

---

## Available Scripts

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Vite dev server with HMR on port 8080                        |
| `npm run build`      | Production build → `.vercel/output` (Nitro Vercel preset)    |
| `npm run build:dev`  | Production build in development mode                         |
| `npm run preview`    | Serve the production build locally                           |
| `npm run lint`       | ESLint across the repo                                       |
| `npm run format`     | Prettier write                                               |
| `npm run sitemap`    | Regenerate `public/sitemap.xml` (needs a TMDB key)           |

Type checking is not wired into an npm script yet, so run it directly:

```bash
npx tsc --noEmit
```

There is one `node:test` file (`src/lib/api/tmdb.fuzzy.test.ts`) but no runner wired up; see
[CONTRIBUTING.md](CONTRIBUTING.md). There is no CI for lint/type/build either — the only workflow
runs the release-notification cron, so run the checks yourself before opening a pull request.

---

## Deployment

### Vercel

1. Import the repository and let Vercel detect the build (`nitro` builds to `.vercel/output`)
2. Add every server-only variable from the table above to the project's environment
3. Add the `VITE_*` variables used at build time
4. Deploy:

   ```bash
   vercel --prod
   ```

`vercel.json` sets security headers, caching for static assets, and a daily cron for
`/api/release-notifications-cron` at 08:00 UTC. The same endpoint is also triggered by
`.github/workflows/release-notifications.yml`, which needs a `CRON_SECRET` repository secret and an
optional `SITE_URL` repository variable.

### Firebase

```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only functions    # optional: session revocation callables
```

Cloud Functions live in `functions/` and require a Blaze plan.

### Post-deploy checks

- Landing page renders with TMDB artwork (server-side TMDB key working)
- Sign-in sets an HTTP-only `__session` cookie; protected routes redirect when it is missing
- `/api/release-notifications-cron` returns 401 without the bearer token
- `npm run sitemap` output reflects the production domain in `VITE_SITE_URL`

---

## Security

- **Server-side session verification** — HTTP-only, `Secure` in production, `SameSite=Lax`, 14-day
  expiry; verified with Firebase Admin on every protected request
- **Two layers of authorization** — route guards plus Firestore rules; the rules are the real
  boundary
- **No service-account material in the browser** — Admin credentials only ever read from
  `process.env`
- **Security headers** — HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `COOP`, and `Permissions-Policy` in `vercel.json`
- **No CSP, by design** — a strict policy broke embed providers and Firebase auth popups; the
  tradeoff is documented in [SECURITY.md](SECURITY.md)
- **Pinned dependency fixes** — known transitive CVEs are closed with `overrides` in `package.json`

Found a vulnerability? Please report it privately — see [SECURITY.md](SECURITY.md). Do not open a
public issue.

---

## Accessibility and Performance

- Semantic landmarks, labelled controls, visible focus rings, and focus trapping in dialogs
- Keyboard-first navigation, including spatial navigation for TV remotes
- `prefers-reduced-motion` honored globally and toggleable in settings
- `navigator.connection.saveData` hint plus a manual data-saver mode
- Route-level code splitting with manual vendor chunks (Firebase, Radix, Recharts)
- TMDB image size variants per surface; `srcset` on the landing hero
- Firestore persistent cache so lists and history survive reloads and flaky networks

---

## Documentation

| Document                                     | Purpose                                            |
| -------------------------------------------- | -------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Local setup, conventions, and PR checklist         |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)     | Community standards and enforcement                |
| [SECURITY.md](SECURITY.md)                   | Reporting, scope, safe harbor, hardening           |
| [src/routes/README.md](src/routes/README.md) | File-based routing conventions                     |
| `firestore.rules`                            | Firestore security rules                           |
| `vercel.json`                                | Headers, rewrites, and cron schedule               |
| `.env.example`                               | Environment template with placeholders only        |
| `LICENSE`                                    | MIT                                                |

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it covers the setup that
actually works, the checks to run, and what gets a pull request sent back.

```bash
git checkout -b feat/short-description
# ...make changes...
npm run format && npx tsc --noEmit && npm run lint && npm run build
git commit -m "feat(scope): describe the change"
```

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues
through [SECURITY.md](SECURITY.md), never in a public issue.

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Wayne Inc.

---

## Acknowledgments

- **TMDB** — metadata and artwork (this product uses the TMDB API but is not endorsed or certified
  by TMDB)
- **Firebase** — auth, Firestore, App Check, messaging, functions
- **TanStack** — Start, Router, Query
- **NVIDIA** — Nemotron models on NIM
- **shadcn/ui**, **Radix UI**, **Tailwind CSS**, **Lucide** — interface foundations
- **Vercel** — hosting and edge delivery
- **Cloudflare Turnstile** — bot protection
