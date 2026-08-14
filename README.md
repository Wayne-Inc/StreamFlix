# StreamFlix

A free, Netflix-style streaming web app. Browse an ever-changing catalog of movies and TV shows, manage multiple user profiles, keep a watchlist, pick up where you left off, and get notified when new releases drop.

**Live at [streamflix.dpdns.org](https://streamflix.dpdns.org)**

## Features

- **Profiles** — create and switch between multiple profiles, each with its own avatar, favorites, and watch history.
- **Browse & explore** — home feed, trending, popular, TV, new releases, genre pages, and mood-based discovery.
- **Search** — instant title and people search with filters (genre, year, rating), sort order, and pagination.
- **Watch** — full-screen player with a season/episode picker for TV shows.
- **Continue Watching** — resumes on any device (local + Firestore-backed).
- **My List** — personal watchlist.
- **Release Calendar** — upcoming titles with reminder notifications.
- **Kids mode** — filter content per profile.
- **Personalized recommendations** — seeded from favorites and watch history.
- **Accounts** — email/password and Google sign-in, password policy enforcement, device tracking.
- **Desktop & Mobile** — Electron desktop build and a Capacitor-based Android wrapper around the live site.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (SSR) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui-style components, Lucide icons |
| Build | Vite 7, TypeScript 5, Nitro (Vercel preset) |
| Auth & data | Firebase Auth, Firebase Firestore, Supabase |
| Content API | TMDB (The Movie Database) |
| Desktop | Electron |
| Mobile | Capacitor (Android) |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+ and npm (or bun)
- Accounts/keys for Firebase, Supabase, and TMDB

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env   # then fill in your keys

# 3. Run the dev server
npm run dev            # http://localhost:8080
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

| Variable | Description |
| --- | --- |
| `FIREBASE_API_KEY` | Firebase web app API key |
| `FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PROJECT_ID` | Supabase project ID |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `TMDB_API_KEY` | TMDB API key (server-side) |
| `VITE_SUPABASE_URL` | Client-side Supabase URL |
| `VITE_SUPABASE_PROJECT_ID` | Client-side Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client-side Supabase publishable key |
| `VITE_TMDB_API_KEY` | Client-side TMDB API key |
| `VITE_SITE_URL` | Public site URL (e.g. `https://streamflix.dpdns.org`) |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (port 8080) |
| `npm run build` | Production build → `.vercel/output` for Vercel |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run electron:dev` | Run the Electron desktop app against the dev server |
| `npm run electron:build` | Build Electron installers into `release/` |
| `npm run desktop` | Open the app in Edge as a PWA-style window |

## Desktop (Electron)

- Dev: `npm run electron:dev` (loads `http://localhost:8080`)
- Prod: `npm run electron:build` (loads `https://streamflix.dpdns.org/`)
- Override the URL anytime: `ELECTRON_START_URL=https://streamflix.dpdns.org/ npx electron .`

## Mobile (Capacitor / Android)

The mobile app is a Capacitor WebView wrapper around the deployed site.

- `npm run mobile:sync` — re-sync native project after config/plugin changes
- `npm run mobile:open` — open `android/` in Android Studio
- `npm run mobile:build` — build an APK

> Note: web changes in `src/` only appear in the app after the site is rebuilt and redeployed.

## Deployment

Vercel deploys directly from the `main` branch of this repository (TanStack Start SSR build, Nitro Vercel preset). Push to `main` to trigger a deploy.

## Project Structure

```
src/
├── components/          # Reusable UI + streamflix components
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # App shell
│   ├── index.tsx        # Landing page
│   ├── auth.tsx         # Sign in / sign up
│   └── _authenticated/  # Authenticated pages (browse, search, watch, ...)
├── lib/                 # Firebase, Supabase, TMDB API, data helpers
├── integrations/        # Third-party service adapters
└── styles.css           # Global styles
electron/                # Electron desktop shell
android/                 # Capacitor Android project
supabase/                # Supabase migrations/configuration
```

## License

[MIT](LICENSE)
