import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";

export const Route = createFileRoute("/tos")({
  head: () => ({
    meta: [
      { title: "Terms of Service — StreamFlix" },
      { name: "description", content: "StreamFlix Terms of Service." },
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
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-muted-foreground">Terms of Service</p>
          <h1 className="text-xl sm:text-4xl font-black">Welcome to StreamFlix</h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of StreamFlix, including any content, functionality, and services offered through our platform. By accessing or using the service, you agree to be bound by these Terms. If you do not agree, you may not use the service.
          </p>
        </div>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By creating an account or using StreamFlix in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms. We reserve the right to update or modify these Terms at any time. Your continued use of the service after any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Account Registration</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must provide accurate, current, and complete information and promptly update it if necessary. You must be at least 13 years of age to use the service.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Use of the Service</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix is provided for personal, non-commercial use only. You may not copy, distribute, sublicense, sell, or otherwise exploit any portion of the service without express written permission. You agree not to:
          </p>
          <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
            <li>Use the service for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to gain unauthorized access to any part of the platform or its systems.</li>
            <li>Interfere with or disrupt the integrity or performance of the service.</li>
            <li>Circumvent any technological measures implemented to protect the platform.</li>
          </ul>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">User Conduct</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You agree to use the service responsibly. Prohibited behavior includes harassment, impersonation, posting harmful content, engaging in fraudulent activity, or violating the intellectual property rights of others. We reserve the right to suspend or terminate accounts that violate these standards.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Intellectual Property</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The StreamFlix platform, including its software, design, logos, and branding, is owned by Samwel Wayne and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, modify, distribute, or publicly display any part of the platform without prior written consent.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Content and Availability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Content available through StreamFlix may change at any time. We do not guarantee that any title will remain accessible or that the service will be available without interruption. We are not liable for any loss of content, data, or access resulting from service changes, technical failures, or maintenance.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Third-Party Links and Services</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The service may contain links to third-party websites or services that are not owned or controlled by StreamFlix. We are not responsible for the content, privacy policies, or practices of any third-party sites. Your use of third-party services is at your own risk.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Disclaimer of Warranties</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. StreamFlix disclaims all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the service will be error-free, secure, or uninterrupted.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the fullest extent permitted by law, StreamFlix and Samwel Wayne shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service, whether based on warranty, contract, tort, or any other legal theory.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Termination</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may suspend or terminate your access at any time for any reason, including violation of these Terms or misuse of the platform. Upon termination, your right to use the service ceases immediately. Provisions relating to intellectual property, disclaimers, and limitation of liability shall survive termination.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Governing Law</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Samwel Wayne operates, without regard to conflict-of-law principles. Any disputes arising under these Terms shall be resolved in the competent courts of that jurisdiction.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Changes to These Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page or through other reasonable means. Continued use of the service after changes take effect constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-2 sm:space-y-4">
          <h2 className="text-base sm:text-2xl font-semibold">Contact Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you have any questions about these Terms, please contact us through our <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
