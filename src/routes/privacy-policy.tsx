import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — StreamFlix" },
      { name: "description", content: "StreamFlix Privacy Policy." },
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
        </div>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>
              <strong>Account Information:</strong> Email address, username, and authentication
              credentials when you register.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with the service,
              including pages viewed, features used, and playback activity.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating system, device
              identifiers, and IP address for analytics and security.
            </li>
            <li>
              <strong>Preferences:</strong> Content preferences, watchlists, ratings, and settings
              you configure on the platform.
            </li>
            <li>
              <strong>Cookies and Tracking:</strong> We use cookies and similar technologies to
              enhance functionality and analyze usage patterns.
            </li>
            <li>
              <strong>Turnstile Verification Data:</strong> To protect against bots and abuse,
              we use Cloudflare Turnstile during sign-in. This collects device and browser
              information to verify human interactions, as outlined in Cloudflare's
              <a href="https://www.cloudflare.com/turnstile-privacy-addendum/" target="_blank"
                rel="noopener noreferrer">Turnstile Privacy Addendum</a>. No personal data is
              sold to third parties.
            </li>
            <li>
              <strong>Analytics Data:</strong> We may use third-party analytics services to
              understand how our service is used.
            </li>
            <li>
              <strong>Communications:</strong> If you contact us directly, we may receive
              additional information about you such as your name, email address, phone number,
              the contents of the message and/or attachments you may send us, and any other
              information you may choose to provide.
            </li>
            <li>
              <strong>Transaction Data:</strong> Information about purchases and other financial
              transactions, including payment card information (which is processed directly by
              our payment partners).
            </li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">How We Use Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>Provide, maintain, and improve our service.</li>
            <li>Personalize your experience and recommend content.</li>
            <li>Communicate with you about your account, service updates, and promotional offers.</li>
            <li>Process transactions and prevent fraud.</li>
            <li>Enable security verification through Cloudflare Turnstile to protect against bots and abuse.</li>
            <li>Monitor and analyze usage trends to enhance platform performance.</li>
            <li>Detect, prevent, and address technical issues, fraud, or other harmful activities.</li>
            <li>Ensure compliance with legal obligations and enforce our policies.</li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Data Sharing and Disclosure</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We do not sell your personal data to third parties. We may share information with
            trusted service providers who assist in operating the platform, subject to
            confidentiality agreements. We may also disclose information if required by law, to
            protect our rights, or to enforce our Terms of Service.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Data Security</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We take reasonable technical and organizational measures to protect your data from
            unauthorized access, alteration, disclosure, or destruction. However, no method of
            transmission or storage is completely secure. You use the service at your own risk.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Your Rights and Choices</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Depending on your jurisdiction, you may have the right to access, correct, delete, or
            port your personal data. You can manage your cookie preferences through your browser
            settings. To exercise your rights, please email us at{" "}
            <ContactEmail className="text-primary hover:underline" />
            .
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Cookies and Tracking</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may use cookies and similar technologies to improve functionality, analyze usage, and
            personalize content. You can control cookies through your browser settings. Disabling
            certain cookies may affect the performance and features of the service.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Children's Privacy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix is not intended for children under the age of 13. We do not knowingly collect
            personal information from children. If we become aware that a child under 13 has
            provided us with personal data, we will take steps to delete it promptly.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">International Data Transfers</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your information may be transferred to and processed in countries other than your own.
            We take appropriate safeguards to ensure that your data remains protected in accordance
            with this Privacy Policy.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page. Continued use of the service after
            changes take effect means you accept the updated policy.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Contact Us</h2>
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
