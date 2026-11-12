# Contributing to StreamFlix

Thanks for wanting to help. StreamFlix is a React 19 / TanStack Start streaming UI with
Firebase-backed accounts and TMDB metadata, so a good contribution usually touches one of three
things: a route or component, a piece of server-side auth/data handling, or the docs around them.

This guide covers how to get the app running, what "ready to merge" means here, and the few rules
that exist because this project handles real user accounts.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Local Setup](#local-setup)
- [Available Scripts](#available-scripts)
- [Coding Standards](#coding-standards)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Review Expectations](#review-expectations)
- [Reporting Bugs and Requesting Features](#reporting-bugs-and-requesting-features)
- [Security Issues](#security-issues)
- [License](#license)

---

## Ways to Contribute

- **Fix a bug** — start from a reproducible report, ideally with a failing case.
- **Improve accessibility** — keyboard traps, missing labels, focus order, and reduced-motion
  handling are always welcome; the project aims for NVDA/VoiceOver-level quality.
- **Improve performance** — image sizes, route-level code splitting, and render churn in browse
  rows are recurring opportunities.
- **Sharpen the docs** — setup steps that tripped you up are the best documentation bugs.
- **Review pull requests** — a thoughtful review is as valuable as a patch.

You do **not** need to ask permission to fix a bug, correct a typo, or improve docs. For anything
that changes behavior, adds a dependency, or alters the data model, open an issue first (see
below).

---

## Before You Start

1. **Search existing issues and pull requests.** Someone may already be working on it.
2. **Open an issue for non-trivial work** — new features, dependency additions, Firestore schema
   changes, or refactors that touch many files. Describe the problem, the proposed approach, and
   the tradeoffs. This prevents wasted effort on a direction that won't be merged.
3. **Keep pull requests focused.** One concern per PR. A bug fix that also reformats 40 files is
   very hard to review and will likely be sent back.
4. **Never open a PR that contains secrets** — see [Security Issues](#security-issues).

---

## Local Setup

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required by Vite 7; the project is developed on Node 24)
- **npm 10+** (primary) or **bun 1.1+** — both lockfiles are committed; see
  [Package Manager](#package-manager)
- A **Firebase project** with Auth and Firestore enabled
- A **TMDB account** with v4 (Bearer) and v3 API credentials

### 1. Install

```bash
git clone https://github.com/Wayne-Inc/StreamFlix.git
cd StreamFlix
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the client keys. At minimum you need Firebase web config and TMDB keys to see anything
beyond an empty shell. The optional services (NVIDIA recommendations, Turnstile, App Check) can be
left blank during development.

`.env.local` and every `.env.*` file except `.env.example` are gitignored — keep it that way.

### 3. Point at emulators (recommended for auth/data work)

`firebase.json` already defines emulator ports:

| Emulator    | Address           |
| ----------- | ----------------- |
| Auth        | `127.0.0.1:9099`  |
| Firestore   | `127.0.0.1:8080`  |
| Functions   | `127.0.0.1:5001`  |
| Emulator UI | `127.0.0.1:4000`  |

```bash
npx firebase emulators:start
```

Then set in `.env.local`:

```bash
VITE_FIREBASE_EMULATOR="1"
VITE_FIREBASE_EMULATOR_HOST="127.0.0.1"
```

Using emulators is strongly preferred for anything touching `firestore.rules`: it lets you prove
your rules work without creating junk data in a real project.

### 4. Run

```bash
npm run dev
# → http://localhost:8080
```

---

## Available Scripts

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR on port 8080                   |
| `npm run build`      | Production build into `.vercel/output`                  |
| `npm run build:dev`  | Production build in development mode                    |
| `npm run preview`    | Serve the production build locally                      |
| `npm run lint`       | ESLint over the repo (check only)                       |
| `npm run format`     | Prettier write across the repo                          |
| `npm run sitemap`    | Regenerate `public/sitemap.xml` (needs a TMDB key)      |

Type checking and auto-fix are not wired into npm scripts yet, so run them directly:

```bash
npx tsc --noEmit        # type check (there is no "typecheck" script today)
npx eslint . --fix      # lint with autofix
npx prettier --write .  # format
```

There is no test runner wired into npm scripts, and CI has no test job. The repository contains a
single `node:test` file, `src/lib/api/tmdb.fuzzy.test.ts`, covering the TMDB fuzzy-search helper.
Because it imports `tmdb.ts`, which pulls in TanStack Start's `createServerFn`, it may not run
outside the Vite toolchain as-is — splitting that helper into a dependency-free module is a
welcome small contribution. If you can run it locally, do; if you add tests, use the same
`node:test` style rather than introducing a new framework without discussing it first.

CI does not run lint, type, or build checks either — the only workflow is the release-notification
cron. The pre-PR checks below are on you, and reviewers will expect you to have run them.

### Package Manager

`package-lock.json` and `bun.lock` are both in the repo, and `bunfig.toml` sets a 24-hour
`minimumReleaseAge` supply-chain guard. Pick **one** package manager for your work and don't
regenerate the other lockfile in the same PR. If `bun install` refuses a very fresh package, that's
the guard doing its job — do not add a `minimumReleaseAgeExcludes` entry without a maintainer's
agreement.

---

## Coding Standards

### TypeScript

- `strict` is on and code must compile cleanly with `npx tsc --noEmit`.
- Avoid `any` in new code. Prefer `unknown` plus narrowing, or a zod schema at the boundary.
- Import with the `@/*` alias (`@/lib/...`, `@/components/...`), matching `tsconfig.json`.
- ESLint bans the Next.js `server-only` package. In TanStack Start, mark server modules with a
  `*.server.ts` filename or the `@tanstack/react-start/server-only` directive instead.

### Formatting

Prettier is the source of truth (`.prettierrc`): **100** print width, **double quotes**,
**semicolons**, **trailing commas**. Don't hand-tune formatting or reformat files you didn't
otherwise touch — it buries the real diff.

### React and data fetching

- Components are function components with hooks; keep them small and colocate route-specific
  pieces under the route that uses them.
- Server state goes through TanStack Query. Reuse existing query keys and mutation patterns rather
  than inventing a parallel cache.
- Preserve the project's optimistic-update pattern: update the query cache and local storage
  first, sync to Firestore in the background, and roll back on error. See the existing
  My List / Continue Watching / profile mutations before writing a new one.
- Clean up effects (subscriptions, listeners, intervals). Continue-watching progress writes fire
  every 5 seconds — don't add a second timer for the same thing.
- Keep `react-refresh/only-export-components` happy: don't export non-component values from files
  that export components.

### Styling and UI

- Tailwind 4 utility classes plus shadcn/ui primitives. Use existing tokens and components before
  adding new ones; `components.json` defines the generator config if you need a new primitive.
- Match the existing Netflix-style layout language: horizontal rows, hover-expanded cards, skeleton
  loaders. Avoid layout shifts and don't hard-code pixel widths that break at 360px.
- Empty, loading, and error states are part of the feature, not polish. Every list/row needs all
  three.
- Reuse the existing TMDB image size variants (`w185`, `w342`, `w780`) rather than introducing
  `original` for card and row artwork; original-size images are heavy and belong at most on a
  detail page.

### Accessibility

New UI is expected to be usable without a mouse and understandable to a screen reader:

- Semantic elements first, ARIA only to fill gaps (`aria-label`, `aria-expanded`, `aria-live`).
- Visible focus states; no `outline: none` without a replacement.
- Modal/dialog focus trapping and restore-on-close.
- Respect `prefers-reduced-motion` for carousels, transitions, and autoplay.
- Keyboard-operable carousels and menus (arrow keys where the pattern implies them).

### Server-side and security-sensitive code

- Session creation/clearing lives in `src/routes/api/session.ts`; the Nitro middleware in
  `src/server.ts` verifies `__session` with Firebase Admin. Changes here need extra review — call
  it out explicitly in your PR.
- Server-only configuration must come from `process.env` on the server, never from a `VITE_`
  variable. `FIREBASE_PRIVATE_KEY`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`, and `NVIDIA_API_KEY`
  are server-only.
- New API routes: validate input with zod, return typed JSON errors, and set `Cache-Control`
  deliberately. Authenticated endpoints must fail closed.
- `firestore.rules` changes must be minimal, commented, and deployed with
  `firebase deploy --only firestore:rules` (or exercised against the emulator). Explain the
  threat you're closing in the PR description.
- Security headers in `vercel.json` are intentional. Don't add a CSP without discussing it first:
  a strict CSP was removed because it broke embed providers and Firebase popups, and reintroducing
  one needs a concrete plan for every embed origin.

### Dependency changes

This project ships a large dependency tree and deliberately pins several transitive packages via
`overrides` (see `package.json`) to resolve CVEs. If you bump a dependency:

- Prefer the smallest possible bump and explain why.
- Don't remove an `overrides` entry without checking what advisory it addressed.
- Note any impact on bundle size in the PR.

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) — the history already follows it:

```
feat(watch): resume playback from last saved position
fix(auth): keep session cookie across hard refresh
refactor(profiles): extract avatar picker into its own component
docs(readme): document emulator setup for Firestore rules
perf(browse): lazy-load genre rows below the fold
chore(deps): bump firebase to 13.1.0
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
An optional scope in parentheses (`auth`, `watch`, `profiles`, `browse`, `api`) is encouraged.

Keep the subject under ~72 characters, imperative mood, no trailing period. Use the body to explain
*why*, not *what*.

Branch names: `feat/short-description`, `fix/short-description`, `docs/...`, `chore/...`.

---

## Pull Request Process

1. **Fork** the repository and branch from `main`:

   ```bash
   git checkout -b feat/amazing-feature
   ```

2. **Make your change**, keeping it scoped to the issue.
3. **Run the checks** (all four):

   ```bash
   npx tsc --noEmit
   npm run format
   npm run lint
   npm run build
   ```

4. **Test manually** and describe what you did. With no runner in CI, reviewers rely on your
   reproduction steps:
   - the happy path
   - an empty/error path
   - a narrow viewport (375px) if the change is visual
   - keyboard-only navigation if the change is interactive
   - the TMDB fuzzy-search test, if you touched that helper and can run it locally
5. **Commit** with a conventional message.
6. **Open the PR** against `main` with:
   - a descriptive title in conventional-commit form
   - what changed and why, linked to the issue (`Closes #123`)
   - screenshots or a short screen recording **before/after** for any UI change
   - deployment/config notes if you added an env var, route, or rule
7. **Respond to review.** Push follow-up commits rather than force-pushing over review history
   unless asked to squash.

### PR Checklist

Copy this into your PR description:

```markdown
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Relevant `node:test` checks pass (if you touched tested code)
- [ ] Formatted with Prettier (`npm run format`)
- [ ] No secrets, keys, tokens, or `.env.local` committed
- [ ] New env vars documented in `.env.example` (placeholders only) and README
- [ ] Firestore rule changes tested against the emulator and explained
- [ ] UI changes include before/after screenshots
- [ ] Loading, empty, and error states handled
- [ ] Keyboard and reduced-motion behavior checked (UI changes)
```

### What Gets a PR Sent Back

- Unrelated refactors or mass reformatting mixed into a fix
- A new dependency where a few lines of existing code would do
- Secrets, real project IDs, or service-account keys in the diff
- UI without loading/empty/error states
- Changes to auth, session, or Firestore rules with no explanation of the security impact
- A rewritten lockfile that switches package managers

---

## Review Expectations

This is a volunteer-maintained project without an SLA. Expect an initial response within about a
week; if a PR sits longer, one polite ping on the thread is welcome, repeated pings are not.

Reviews focus on correctness, security impact, accessibility, and whether the change fits the
existing patterns. Disagreement is fine — argue the technical tradeoff, not the person, and follow
the [Code of Conduct](CODE_OF_CONDUCT.md).

Maintainers may close stale PRs after 60 days of no response, with an invitation to reopen.

---

## Reporting Bugs and Requesting Features

There are no issue templates yet, so please include this in a plain issue:

**Bug reports**

- What you expected vs. what happened
- Exact steps to reproduce, starting from a URL
- Browser and OS, plus whether it's the live site or a local build
- Console errors / network failures (redact tokens, cookies, and user data)
- A screenshot or recording for visual bugs

**Feature requests**

- The problem you're trying to solve, not just the solution
- How it fits the app's existing patterns
- Any tradeoffs (bundle size, new service, maintenance cost)

Please don't paste full `env` values, session cookies, Firebase ID tokens, or service-account
JSON into an issue.

---

## Security Issues

**Do not open a public issue, PR, or discussion for a vulnerability.** Follow
[SECURITY.md](SECURITY.md) instead. That includes leaked keys: report them privately so they can be
rotated before they're indexed.

---

## License

StreamFlix is released under the [MIT License](LICENSE). By submitting a pull request you agree
that your contribution is licensed under the same terms (inbound = outbound) and that you have the
right to submit it.
