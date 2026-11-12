# Security Policy

StreamFlix handles user accounts, profiles, watch history, and push-notification tokens, and it
runs server-side session verification with privileged Firebase credentials. We take security
reports seriously and appreciate the time it takes to investigate and report an issue responsibly.

---

## Reporting a Vulnerability

**Please do not open a public issue, pull request, discussion, or social-media post about a
vulnerability.** Public disclosure before a fix puts real users at risk.

Report privately through GitHub's private vulnerability reporting:

> **[Report a vulnerability](https://github.com/Wayne-Inc/StreamFlix/security/advisories/new)**

That form is visible only to the repository's maintainers.

If the form is unavailable to you, open a **content-free** issue stating only that you have a
security report and need a private channel. Do not include reproduction steps, URLs, payloads, or
evidence in that issue.

Please include as much of the following as you can:

- A short summary of the issue and its security impact
- The affected component (route, API endpoint, `firestore.rules`, Cloud Function, config)
- Step-by-step reproduction, with the exact URL and request where relevant
- Proof of concept: request/response snippets, screenshots, or a minimal script
- Whether the issue reproduces on the live deployment (<https://streamflix.dpdns.org>) or only
  locally
- The commit, tag, or version you tested against
- Your assessment of severity, and any suggested remediation
- How you'd like to be credited (name, handle, or anonymous)

Redact real user data, session cookies, ID tokens, and service-account material from anything you
attach. If you need to demonstrate a token's validity, show the minimum — for example, that a
decoded token has the expected claims — rather than dumping a live credential.

### Scope note for forks and self-hosted deployments

Only the upstream repository and the official live demo are in scope. If you are testing a fork or
your own deployment, report to that operator — they control their Firebase project, secrets, and
`firestore.rules`, so maintainers of upstream may not be able to reproduce or fix what you find.

---

## Supported Versions

StreamFlix ships as a continuously deployed web app; `main` is the supported line.

| Version        | Supported |
| -------------- | --------- |
| `2.x` (`main`) | Yes       |
| `< 2.0`        | No        |

Security fixes land on `main` and are deployed; there are no backport branches for older majors.
Forks and self-hosted deployments are the operator's responsibility — see
[the scope note above](#scope-note-for-forks-and-self-hosted-deployments).

---

## What to Expect

| Stage                                  | Target                          |
| -------------------------------------- | ------------------------------- |
| Acknowledgement of your report         | 3 business days                 |
| Initial triage and severity assessment | 7 business days                 |
| Fix — Critical                         | 7 days                          |
| Fix — High                             | 30 days                         |
| Fix — Medium / Low                     | 90 days or next planned release |
| Coordinated public disclosure          | By agreement, default 90 days   |

These are best-effort targets for a volunteer-maintained project, not a contractual SLA. We will
keep you informed if a timeline slips, and we will tell you if we conclude something is not a
vulnerability and why.

There is **no bug bounty program**. We credit reporters in the advisory and release notes unless
you ask to remain anonymous.

---

## In Scope

Report anything that lets an attacker do something they should not be able to do, especially across
account or profile boundaries.

| Area                             | What counts                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and sessions      | Forged or replayed `__session`, `authMiddleware` bypass, session fixation, CSRF on `/api/session`                                 |
| Authorization and data isolation | Cross-user or cross-profile reads and writes that `firestore.rules` should block, profile PIN bypass                              |
| Firestore rules                  | Privilege escalation through an unvalidated field (for example a spoofed `userId`), writes outside the allowed shape              |
| Secrets and configuration        | Exposed `FIREBASE_PRIVATE_KEY`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`, or `NVIDIA_API_KEY`; server-only values in a client bundle |
| Injection and XSS                | Stored XSS via profile names, avatars, or third-party metadata; `javascript:` URLs reaching `href` or an iframe source            |
| Server-side requests             | SSRF or open redirect under `/api/*`, unauthenticated cron endpoint, `client-ip` spoofing around rate limits                      |
| Bot and abuse protection         | Turnstile or App Check bypass that enables credential stuffing, mass signups, or notification spam                                |
| Cloud Functions                  | Missing auth checks in `functions/src/index.ts`, fan-out to arbitrary device tokens                                               |
| Dependencies                     | Exploitable path in a direct or transitive dependency; include the advisory ID and the call path                                  |

Changes inside `src/server/`, `src/routes/api/`, and `firestore.rules` are the highest-risk surface;
reports there get priority.

### A note on public client configuration

StreamFlix intentionally ships Firebase **web** config and TMDB **client** credentials to the
browser — anything prefixed `VITE_` is public by design, and the control is your Firebase API-key
restrictions rather than secrecy. Those values alone are not a vulnerability.

They become interesting if you can show they grant more than read access to public metadata, or an
abuse path that API-key restrictions and App Check should have blocked. Service-account
credentials (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) are a different matter entirely —
exposure of those is always critical.

---

## Out of Scope

The following are generally not accepted as security reports. If you believe one of these chains
into a real exploit, say so explicitly and include the chain.

- **The intentional absence of a Content-Security-Policy.** A strict CSP was removed because it
  broke embed providers and Firebase authentication popups. A "missing CSP" report by itself will
  be closed. A concrete, exploitable XSS that a specific CSP would have stopped is in scope.
- **Clickjacking** — responses send `X-Frame-Options: DENY` and
  `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- **Third-party embed players** — ads, popups, redirects, tracking, or content inside provider
  iframes are outside this project's control; report those to the provider.
- **Platform issues in Firebase, TMDB, Vercel, or Cloudflare** — report upstream. We'll happily
  track a mitigation on our side.
- **Volumetric or resource-exhaustion DoS**, traffic floods, or stress testing against production.
- **Automated scanner output without a proof of concept.** A raw ZAP/Burp/npm-audit dump with no
  demonstrable impact is not actionable; show the exploit or the reachable call path.
- **Self-XSS**, or XSS that requires the victim to paste attacker-supplied JavaScript into their own
  console.
- **Rate-limiting gaps** on public, unauthenticated metadata endpoints with no meaningful abuse
  impact.
- **False "missing header" reports** — the headers in `vercel.json` are already applied. This
  includes TLS/cipher configuration (terminated by the host) and email spoofing/DMARC for unrelated
  domains.
- **The profile PIN as a security boundary against a determined local user.** PINs gate the UI;
  they are not encryption of the underlying data. Weak-PIN or offline-brute-force reports about a
  PIN you control locally are out of scope unless they expose another account's data.
- **Physical access, rooted/jailbroken devices, or a compromised browser extension.**
- **Social engineering** of maintainers or users.
- **Content, copyright, availability, or geoblocking complaints.** These are legal/product issues,
  not vulnerabilities. Please don't use the security channel for them.

---

## Safe Harbor

We support good-faith security research on StreamFlix and will not pursue or support legal action
for accidental, good-faith violations of this policy. This applies when you:

- Work only against your **own** accounts and test data, or the public live demo using accounts you
  created
- Stop as soon as you have proof of a vulnerability, and do not pivot, escalate, or persist
- Do not access, modify, delete, or exfiltrate other users' data, and do not degrade the service for
  others
- Do not run automated scans at a volume that affects availability
- Report privately and give us reasonable time to fix before any public disclosure
- Do not use a finding for extortion, to demand payment, or to gain unauthorized access

If you are unsure whether an action is allowed, ask first through the private reporting form.

This policy does not authorize testing of third-party services, and it does not override any
applicable law.

---

## Handling Leaked Secrets

If you find a live credential — a service-account key, `CRON_SECRET`, Turnstile secret, or an
NVIDIA key:

1. **Do not validate it beyond the minimum needed to confirm it is live.** Don't enumerate
   projects, read user data, or spend quota proving impact.
2. Report it privately and immediately, with the location you found it (commit, file, bundle path,
   or URL).
3. We will rotate the credential, purge it from history where feasible, and confirm back to you.

The same applies to session cookies and ID tokens found in logs or error-tracking output.

---

## Security Design Notes for Deployers

If you run your own instance, these are the controls the app expects you to preserve:

- **Server-side sessions.** `__session` is an HTTP-only, Secure, `SameSite=Lax` cookie verified by
  Firebase Admin on every protected request. Don't move auth checks to the client, and don't widen
  cookie scope to a parent domain you don't control.
- **Two layers of authorization.** Route guards are defense-in-depth; `firestore.rules` is the real
  boundary. Any new collection or subcollection needs rules, and rules must validate field shape and
  ownership — not just `request.auth != null`.
- **Separate Firebase projects** for development and production. A dev service account should never
  be able to touch production user data.
- **Secret hygiene.** Server-only variables belong in Vercel's environment settings, never in
  `.env.local` committed to git, never in a `VITE_` variable, and never in client code. Rotate
  `CRON_SECRET` if it has ever been pasted into an issue or log.
- **App Check and Turnstile** should be enabled and enforced in production; they are optional in
  development, which is exactly why bypasses are easy to miss.
- **Restrict the Firebase web API key** by HTTP referrer and enable only the APIs you use.
- **Lockfile review.** Dependency pins in `package.json` `overrides` exist to close known
  advisories; removing them silently reopens those CVEs. `bunfig.toml` also enforces a 24-hour
  `minimumReleaseAge` guard against freshly published (potentially compromised) package versions —
  keep it.
- **Security headers** live in `vercel.json` (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  Referrer-Policy, COOP, Permissions-Policy). If you deploy elsewhere, reproduce them.

---

## Disclosure Policy

We follow coordinated disclosure:

1. You report privately; we acknowledge and investigate.
2. We agree on a severity and a target fix date.
3. We prepare and deploy a fix, and where useful a GitHub Security Advisory.
4. We publish the advisory with credit (unless you prefer otherwise) after the fix is live or after
   the agreed embargo ends — whichever comes first.

If a vulnerability is already being exploited in the wild, tell us immediately in the report title
so we can shorten the embargo.

---

## Acknowledgements

Thank you to everyone who reports issues privately and gives us room to fix them. Reporters are
credited in the corresponding advisory and release notes.

---

## Contact Summary

- **Vulnerability report** — [submit a private report][advisory]
- **Conduct concern** — the same [private advisory form][advisory], with `[CONDUCT]` in the
  title; see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Regular bugs and feature ideas** — [public issues][issues]
- **Contribution questions** — [CONTRIBUTING.md](CONTRIBUTING.md)

[advisory]: https://github.com/Wayne-Inc/StreamFlix/security/advisories/new
[issues]: https://github.com/Wayne-Inc/StreamFlix/issues
