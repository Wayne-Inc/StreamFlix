import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export const PRIVACY_VERSION = "2026-10-24";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — StreamFlix" },
      { name: "description", content: "StreamFlix Privacy Policy. Learn how we collect, use, and protect your personal information when using our streaming platform." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground px-4 py-8 sm:px-8">
      <header className="mx-auto mb-10 flex max-w-4xl items-center justify-between gap-4">
        <Logo className="text-lg sm:text-xl" />
        <Link
          to="/"
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          Back to Home
        </Link>
      </header>
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-lg">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Privacy Policy
          </p>
          <h1 className="text-xl sm:text-4xl font-black">Your Privacy Matters</h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            This Privacy Policy explains how StreamFlix collects, uses, discloses, and protects your
            information when you use the service. By using StreamFlix, you consent to the practices
            described in this policy.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            <strong>Version:</strong> {PRIVACY_VERSION}
          </p>
        </div>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">1. Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>
              <strong>Account Information:</strong> Email address, username, and authentication
              credentials when you register via Firebase Authentication.
            </li>
            <li>
              <strong>Profile Information:</strong> Profile names, avatars (uploaded images or TMDB
              character selections), and kids mode
              settings for each profile under your account.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with the service,
              including pages viewed, features used, search queries, playback activity (what you
              watch, when, and for how long), and watchlist/favorites data.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating system, device
              identifiers, IP address, and screen resolution for analytics, security, and responsive
              design optimization.
            </li>
            <li>
              <strong>Preferences:</strong> Content preferences, watchlists and history.
            </li>
            <li>
              <strong>Cookies and Local Storage:</strong> We use cookies, localStorage, and
              IndexedDB to maintain session state, store preferences offline, cache data for
              performance, and enable offline-first functionality.
            </li>
            <li>
              <strong>Turnstile Verification Data:</strong> To protect against bots and abuse,
              we use Cloudflare Turnstile during sign-in and sensitive actions. This collects
              device and browser information to verify human interactions, as outlined in 
              <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank"
                rel="noopener noreferrer"> Cloudflare's Turnstile Privacy Addendum</a>. No personal data is
              sold to third parties.
            </li>
            <li>
              <strong>Firebase App Check Data:</strong> We use Firebase App Check with reCAPTCHA
              v3 to verify requests come from our genuine application. This collects minimal device
              attestation data as described in 
              <a href="https://firebase.google.com/docs/app-check" target="_blank"
                rel="noopener noreferrer"> Google's App Check documentation</a>.
            </li>
            <li>
              <strong>Analytics Data:</strong> We use third-party analytics services to
              understand how our service is used (Vercel, Cloudflare and Google Analytics). All analytics data is anonymized.
            </li>
            <li>
              <strong>AI Recommendation Data:</strong> When you use AI-powered recommendations,
              your viewing history and preferences (anonymized) are sent to NVIDIA Nemotron API to
              generate personalized suggestions. This data is not stored by the AI provider. All the data is terminated after every session.
            </li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">2. How We Use Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>Provide, maintain, and improve our service.</li>
            <li>Authenticate users and manage account security via Firebase Authentication.</li>
            <li>Personalize your experience and recommend content (including AI-powered recommendations).</li>
            <li>Sync your profiles, watchlists, and preferences across devices via Firestore.</li>
            <li>Communicate with you about your account, service updates, security alerts, and promotional offers (opt-out available).</li>
            <li>Enable security verification through Cloudflare Turnstile and Firebase App Check to protect against bots and abuse.</li>
            <li>Fetch movie and TV metadata from TMDB API to display rich content information.</li>
            <li>Monitor and analyze usage trends to enhance platform performance.</li>
            <li>Detect, prevent, and address technical issues, fraud, or other harmful activities.</li>
            <li>Ensure compliance with legal obligations and enforce our Terms of Service.</li>
            <li>Provide offline functionality through service workers and local data caching.</li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">3. Data Sharing and Disclosure</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We do not sell your personal data to third parties. We may share information with
            trusted service providers who assist in operating the platform, subject to
            confidentiality agreements:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
            <li><strong>Firebase (Google):</strong> Authentication, Firestore database, Cloud Functions, Hosting, and App Check.</li>
            <li><strong>TMDB API:</strong> Movie/TV metadata requests (no personal data shared, only content IDs).</li>
            <li><strong>NVIDIA Nemotron API:</strong> Anonymized viewing preferences for AI recommendations (no account identifiers).</li>
            <li><strong>Cloudflare:</strong> Turnstile verification and CDN services.</li>
            <li><strong>Vercel:</strong> Hosting and serverless function execution (if deployed on Vercel).</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            We may also disclose information if required by law, to protect our rights, or to
            enforce our Terms of Service. We will not share your data with third parties for their
            own marketing purposes.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">4. Data Security</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We take reasonable technical and organizational measures to protect your data from
            unauthorized access, alteration, disclosure, or destruction:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
            <li>All data in transit is encrypted via TLS 1.2+.</li>
            <li>Firebase Authentication handles password hashing and secure token management.</li>
            <li>Firestore security rules restrict data access to authenticated users only.</li>
            <li>Firebase App Check with reCAPTCHA v3 validates all API requests originate from our app.</li>
            <li>Cloudflare Turnstile protects authentication endpoints from automated abuse.</li>
            <li>Profile avatars uploaded to Firebase Storage are served via secure, signed URLs.</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            However, no method of transmission or storage is completely secure. You use the service
            at your own risk. We recommend using strong, unique passwords and enabling two-factor
            authentication where available.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">5. Data Retention</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We retain your data for as long as your account is active or as needed to provide you
            services.
            Upon account deletion, all personal data is permanently removed within 30 days. Backups
            may retain data for up to 90 days for disaster recovery.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">6. Your Rights and Choices</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Depending on your jurisdiction (GDPR, CCPA, etc.), you may have the right to:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
            <li>Access your personal data.</li>
            <li>Correct inaccurate data.</li>
            <li>Delete your data (via account deletion in Settings).</li>
            <li>Export/port your data (JSON export available in Settings).</li>
            <li>Restrict or object to processing.</li>
            <li>Withdraw consent for marketing communications.</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            You can manage your cookie preferences through your browser settings. Disabling
            certain cookies may affect the performance and features of the service.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">7. Cookies and Tracking</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may use cookies and similar technologies to improve functionality, analyze usage, and
            personalize content:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
            <li><strong>Essential Cookies:</strong> Session management, authentication tokens, CSRF protection.</li>
            <li><strong>Performance Cookies:</strong> Anonymous analytics, error tracking.</li>
            <li><strong>Local Storage/IndexedDB:</strong> Offline cache, watchlist, recently viewed, user preferences.</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            You can control cookies through your browser settings. Clearing local storage will log
            you out and reset preferences. We do not use third-party advertising cookies.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">8. Children's Privacy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix is not intended for children under the age of 13. We do not knowingly collect
            personal information from children. If we become aware that a child under 13 has
            provided us with personal data, we will take steps to delete it promptly.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            Parents can create Kids Profiles to
            provide a safer viewing experience for children. The account holder is responsible for
            configuring appropriate content limits for each profile.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">9. International Data Transfers</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your information may be transferred to and processed in countries other than your own.
            We take appropriate safeguards to ensure that your data remains protected in accordance
            with this Privacy Policy, including Standard Contractual Clauses where applicable.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">10. AI Data Processing</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When you use AI-powered recommendations, the following applies:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
            <li>Only anonymized viewing history and genre preferences are sent to NVIDIA Nemotron API.</li>
            <li>No personally identifiable information (email, username, IP) is included in AI requests.</li>
            <li>NVIDIA does not store or train on your data per their API terms.</li>
            <li>Recommendations are generated in real-time and not logged by StreamFlix.</li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">11. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page or through other reasonable means.
            Continued use of the service after changes take effect means you accept the updated policy.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">12. Contact Us</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you have questions or concerns about this Privacy Policy or your data, please reach
            out to{" "}
            <ContactEmail className="text-primary hover:underline" />
            .
          </p>
        </section>
      </div>
    </main>
  );
}