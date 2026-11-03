# StreamFlix

A modern streaming platform with Netflix-style UI, multi-profile support, cross-device sync, and server-side authentication. Built with React 19, TanStack Start, TypeScript, Firebase, and TMDB.

**Live Demo:** [https://streamflix.dpdns.org](https://streamflix.dpdns.org)

---

## What is StreamFlix?

StreamFlix is a full-featured streaming web application that aggregates movie and TV show metadata from TMDB and plays content through multiple embed providers. It provides a Netflix-like experience with:

- **Unified browsing** — Search and discover across movies/TV with genre rows, trending, and personalized recommendations
- **Multi-profile accounts** — Up to 5 profiles per account with custom avatars, PIN protection, and Kids Mode
- **Continue Watching** — Progress saved every 5 seconds, synced across devices via Firestore
- **My List** — Personal watchlist with optimistic UI and cross-tab sync
- **Server-side authentication** — User is authenticated before HTML renders (no flash, survives browser restarts)
- **AI recommendations** — NVIDIA Nemotron 3 Ultra powered suggestions based on watch history
- **Export your data** — Download all your data as JSON (GDPR-compliant)

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│  React 19 + TanStack Start (SSR) + TanStack Query + Tailwind 4     │
│  • File-based routing with type-safe URLs                          │
│  • Server state management with caching, retries, optimistic UI    │
│  • shadcn/ui accessible components                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Vercel / Nitro)                      │
│  • Nitro/h3 middleware intercepts ALL requests                     │
│  • authMiddleware verifies __session cookie via Firebase Admin     │
│  • Protected routes: /profiles, /browse, /watch/*, /settings, etc. │
│  • API routes: /api/session (create/clear session cookies)         │
└─────────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
┌─────────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│      TMDB API       │ │ Firebase Auth │ │    Cloud Firestore  │
│  Metadata, images,  │ │  Email/Pass,  │ │  Profiles, devices, │
│  search, providers  │ │  Google, GitHub│ │  watch history,     │
│                     │ │               │ │  my list, FCM tokens│
└─────────────────────┘ └───────────────┘ └─────────────────────┘
              │                 │                 │
              ▼                 ▼                 ▼
┌─────────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│   NVIDIA Nemotron   │ │ Firebase App  │ │  Cloudflare         │
│   3 Ultra (AI)      │ │ Check (reCAPTCHA│  Turnstile          │
│                     │ │  v3)          │ │  (bot protection)   │
└─────────────────────┘ └───────────────┘ └─────────────────────┘
```

### Server-Side Authentication Flow

```
1. Request → Vercel Edge/Origin
2. Nitro middleware (src/server.ts) checks __session cookie
3. Cookie verified via Firebase Admin SDK (verifySessionCookie)
4. Valid? → Continue to TanStack Start SSR handler
   Invalid? → 302 Redirect to /auth?redirect=...
5. On sign-in: Client POST /api/session { idToken } → Sets HTTP-only cookie
6. On sign-out: DELETE /api/session → Clears cookie
```

**Key files:**
- `src/server.ts` — Nitro entry + authMiddleware
- `src/server/firebase-admin.ts` — Firebase Admin init
- `src/server/server-auth.ts` — Cookie helpers + middleware
- `src/routes/api/session.ts` — POST (create) / DELETE (clear) session
- `src/routes/_authenticated/route.tsx` — Client-side guard (defense-in-depth)

---

## External Services

| Service | Purpose | Required |
|---------|---------|----------|
| **Firebase** | Auth (email/password, Google, GitHub), Firestore (data), App Check (reCAPTCHA v3), FCM (push) | ✅ Yes |
| **TMDB (The Movie Database)** | Movie/TV metadata, images, search, watch providers | ✅ Yes |
| **NVIDIA NIM** | AI recommendations (Nemotron 3 Ultra) | ⚠️ Optional |
| **Cloudflare Turnstile** | Bot protection on auth forms | ⚠️ Optional |
| **Vercel** | Hosting, serverless functions, cron jobs | ✅ Yes (recommended) |

---

## Setup Guide

### Prerequisites
- Node.js 20+ (LTS)
- npm 10+ or bun 1.1+
- Firebase project with Auth, Firestore, App Check enabled
- TMDB account with API keys (v4 Bearer + v3 fallback)

### 1. Clone & Install
```bash
git clone https://github.com/Wayne-Inc/StreamFlix.git
cd StreamFlix
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

**Client variables (`.env.local`):**
| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID (`1:xxx:web:xxx`) |
| `VITE_FIREBASE_VAPID_KEY` | FCM Web Push VAPID key (for notifications) |
| `VITE_TMDB_API_KEY` | TMDB v4 Bearer Token |
| `VITE_TMDB_V3_API_KEY` | TMDB v3 API Key (fallback) |
| `VITE_NVIDIA_API_KEY` | NVIDIA NIM API Key (optional) |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile Site Key (optional) |
| `VITE_APP_CHECK_SITE_KEY` | reCAPTCHA v3 Site Key (optional) |
| `VITE_SITE_URL` | Your site URL (e.g., `https://streamflix.dpdns.org`) |

**Server-only secrets (Vercel Dashboard → Settings → Environment Variables):**
| Variable | Description |
|----------|-------------|
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account JSON (full key with headers) |
| `TURNSTILE_SECRET_KEY` | Turnstile Secret Key |
| `CRON_SECRET` | Bearer token for `/api/release-notifications-cron` |

### 3. Firebase Setup
1. **Authentication** → Enable Email/Password, Google, GitHub providers
2. **Firestore** → Create database in production mode
3. **App Check** → Register reCAPTCHA v3 site, copy Site Key
4. **Service Account** → Project Settings → Service Accounts → Generate new private key
5. Deploy rules & indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Firebase Admin on Vercel
Add these to **Vercel Dashboard → Settings → Environment Variables**:
- `FIREBASE_CLIENT_EMAIL` = `client_email` from service account JSON
- `FIREBASE_PRIVATE_KEY` = `private_key` from JSON (keep `-----BEGIN PRIVATE KEY-----` lines)

### 5. Run Development
```bash
npm run dev
# → http://localhost:5173
```

### 6. Deploy to Vercel
```bash
vercel link
# Add all env vars in Vercel Dashboard
vercel --prod
```

---

## Project Structure (Key Directories)

```
src/
├── components/
│   ├── streamflix/      # Feature components (Navbar, MovieCard, VideoPlayer, etc.)
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── api/tmdb.ts      # TMDB wrapper (typed, cached)
│   ├── api/ai.ts        # NVIDIA Nemotron client
│   ├── firebase.ts      # Firebase init + App Check
│   ├── continue-watching.ts
│   ├── my-list.ts
│   ├── profiles.ts
│   └── push.ts          # FCM push notifications
├── routes/
│   ├── _authenticated/  # Protected routes (server auth + client guard)
│   │   ├── browse.tsx
│   │   ├── watch.$id.tsx
│   │   ├── profiles.tsx
│   │   ├── settings.tsx  # Export data, notifications, delete account
│   │   ├── explore/      # Genre pages ($genreId.tsx)
│   │   ├── assistant.tsx
│   │   ├── calendar.tsx
│   │   ├── history.tsx
│   │   ├── mylist.tsx
│   │   ├── search.tsx
│   │   ├── movie.$id.tsx
│   │   ├── person.$id.tsx
│   │   ├── force-password.tsx
│   │   └── route.tsx     # Client-side auth guard
│   ├── api/             # Server-only API routes
│   │   ├── session.ts           # Create/clear session cookie
│   │   ├── release-notifications-cron.ts
│   │   ├── verify-recaptcha.ts
│   │   └── client-ip.ts
│   ├── auth.tsx         # Sign in/up (calls /api/session)
│   ├── index.tsx        # Landing (instant redirect if authed)
│   ├── tos.tsx
│   ├── privacy-policy.tsx
│   └── offline.tsx
├── server/              # SERVER-ONLY CODE (never bundled to client)
│   ├── firebase-admin.ts
│   └── server-auth.ts
└── main.tsx             # Entry, providers, queryClient
```

---

## Key Features Implementation

### Optimistic Updates (Almost Everything)
- **Profile CRUD** — TanStack Query cache update → background Firestore sync → rollback on error
- **My List** — localStorage instant add/remove → Firestore sync → BroadcastChannel cross-tab
- **Continue Watching** — localStorage every 5s → Firestore → multi-tab sync
- **Sign Out** — Immediate localStorage clear + navigate → background cleanup
- **Export Data** — Fetches all collections → downloads JSON

### Security
- **Server-side auth** — HTTP-only, Secure, SameSite=Lax cookies (14-day expiry)
- **Firebase App Check** — reCAPTCHA v3 on all API calls
- **No CSP** — Removed (broke embed providers & Firebase popups)
- **Trusted Types** — Enforced
- **Iframe sandbox** — Explicit `allow` policies per provider
- **Dependencies** — `@grpc/grpc-js@^1.14.6` (fixed CVE alerts #75, #77)

### Accessibility
- Semantic HTML, ARIA labels, focus management
- Keyboard navigation, reduced motion support
- Screen reader tested (NVDA, VoiceOver)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173, HMR) |
| `npm run build` | Production build → `.vercel/output` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint with auto-fix |
| `npm run typecheck` | TypeScript compile check |
| `npm run format` | Prettier format |
| `npm run sitemap` | Generate `sitemap.xml` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| `.env.example` | Environment variable template (all placeholders, no secrets) |
| `firestore.rules` | Security rules reference |
| `vercel.json` | Headers, rewrites, crons |
| `LICENSE` | MIT License |

---

## Contributing

```bash
# 1. Fork & branch
git checkout -b feat/amazing-feature

# 2. Make changes (follow code standards)
# 3. Run quality checks
npm run typecheck && npm run lint && npm run build

# 4. Commit (conventional)
git commit -m "feat: add amazing feature"

# 5. Push & PR
git push origin feat/amazing-feature
```

**PR Requirements:**
- TypeScript compiles (`npm run typecheck`)
- ESLint passes (`npm run lint`)
- Build succeeds (`npm run build`)
- Descriptive title + description
- Screenshots for UI changes

---

## License

MIT License — See [LICENSE](LICENSE)

---

## Acknowledgments

- **TMDB** — Movie/TV metadata & images
- **Firebase** — Auth, Firestore, App Check, Hosting
- **TanStack** — Router, Query, Start
- **NVIDIA Nemotron** — AI recommendations
- **shadcn/ui** — Accessible component primitives
- **Tailwind CSS** — Utility-first styling
- **Lucide** — Icons
- **Vercel** — Deployment