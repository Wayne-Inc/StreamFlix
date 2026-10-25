import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export const TOS_VERSION = "2026-10-24";

export const Route = createFileRoute("/tos")({
  head: () => ({
    meta: [
      { title: "Terms of Service — StreamFlix" },
      { name: "description", content: "StreamFlix Terms of Service. Learn about your rights and responsibilities when using our streaming platform." },
    ],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
            Terms of Service
          </p>
          <h1 className="text-xl sm:text-4xl font-black">Welcome to StreamFlix</h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of StreamFlix, including
            any content, functionality, and services offered through our platform. By accessing or
            using the service, you agree to be bound by these Terms. If you do not agree, you may
            not use the service.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            <strong>Version:</strong> {TOS_VERSION}
          </p>
        </div>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By creating an account or using StreamFlix in any way, you acknowledge that you have
            read, understood, and agree to be bound by these Terms. We reserve the right to update
            or modify these Terms at any time. Your continued use of the service after any changes
            constitutes acceptance of the new Terms. We will notify you of material changes via
            email or through the platform.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">2. Account Registration & Eligibility</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You may be required to create an account to access certain features. You are responsible
            for maintaining the confidentiality of your login credentials and for all activity under
            your account. You must provide accurate, current, and complete information and promptly
            update it if necessary. You must be at least 13 years of age to use the service.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix supports multiple user profiles per account, including Kids Profiles. The account holder is responsible for all profiles created
            under their account.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">3. Use of the Service</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix is provided for personal, non-commercial use. The software is open source and
            licensed under the MIT License, so you're free to use, copy, modify, and share the code.
            When using the service, you agree not to:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>Use the service for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to gain unauthorized access to any part of the platform or its systems.</li>
            <li>Interfere with or disrupt the integrity or performance of the service.</li>
            <li>Circumvent any technological measures implemented to protect the platform (including security measures like Cloudflare Turnstile and Firebase App Check).</li>
            <li>Use any automated system (including robots, spiders, or scrapers) to access the service in a manner that sends more request messages to our servers in a given period of time than a human can reasonably produce in the same period by using a conventional online web browser.</li>
            <li>Share your account credentials with unauthorized users or allow concurrent streaming beyond reasonable personal use.</li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">4. User Conduct</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You agree to use the service responsibly. Prohibited behavior includes harassment,
            impersonation, posting harmful content, engaging in fraudulent activity, or violating
            the intellectual property rights of others. We reserve the right to suspend or terminate
            accounts that violate these standards.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Profile avatars and customizations must not contain offensive, inappropriate, or
            copyrighted material. We reserve the right to remove any user-generated content that
            violates these standards.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">5. Content and Availability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Content available through StreamFlix is sourced from The Movie Database (TMDB) API and
            may change at any time. We do not guarantee that any title will remain accessible or that
            the service will be available without interruption. We are not liable for any loss of
            content, data, or access resulting from service changes, technical failures, or maintenance.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Streaming links are provided by third-party sources. StreamFlix does not host, store, or
            control any video content. Availability and quality of streams may vary and are not
            guaranteed. We do not endorse or verify the legality of third-party streaming sources.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">6. AI-Powered Features</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix offers AI-powered content recommendations using NVIDIA models.
            These recommendations are generated based on your viewing history and preferences.
            AI-generated content is provided "as is" and may not always be accurate or appropriate.
            We do not guarantee the quality, relevance, or safety of AI-generated recommendations.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">7. Third-Party Links and Services</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The service may contain links to third-party websites or services that are not owned or
            controlled by StreamFlix. We are not responsible for the content, privacy policies, or
            practices of any third-party sites. Your use of third-party services is at your own
            risk. This includes TMDB for metadata, Firebase for authentication and database, and
            third-party streaming providers.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">8. Disclaimer of Warranties</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The service is provided on an "as is" and "as available" basis without warranties of any
            kind, either express or implied. StreamFlix disclaims all warranties, including but not
            limited to merchantability, fitness for a particular purpose, and non-infringement. We
            do not warrant that the service will be error-free, secure, or uninterrupted.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the fullest extent permitted by law, StreamFlix and Wayne Inc shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising out of
            or related to your use of the service, whether based on warranty, contract, tort, or any
            other legal theory.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">10. Termination</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may suspend or terminate your access at any time for any reason, including violation
            of these Terms or misuse of the platform. Upon termination, your right to use the
            service ceases immediately. Provisions relating to intellectual property, disclaimers,
            and limitation of liability shall survive termination.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You may delete your account at any time through the Settings page. Account deletion
            permanently removes all profiles, watch history, preferences, and associated data.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">11. Changes to These Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. We will notify you of material changes by
            posting the updated Terms on this page or through other reasonable means. Continued use
            of the service after changes take effect means you accept the updated terms.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">12. Governing Law</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which StreamFlix operates, without regard to conflict of law principles.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">13. Contact Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you have any questions about these Terms, please email us at{" "}
            <ContactEmail className="text-primary hover:underline" />
            .
          </p>
        </section>
      </div>
    </main>
  );
}