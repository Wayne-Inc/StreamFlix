import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";

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
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-border bg-surface p-8 shadow-lg">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Privacy Policy</p>
          <h1 className="text-4xl font-black">Your Privacy Matters</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            This Privacy Policy explains how StreamFlix collects, uses, and protects your information when you use the service.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may collect basic account information, playback data, preferences, and technical details necessary to operate the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How We Use Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use information to personalize your experience, improve the service, and provide support. We do not sell personal data to third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Data Security</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We take reasonable measures to protect your data, but no system can be completely secure. Use the service at your own risk.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cookies and Tracking</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may use cookies and similar technologies to improve functionality and analyze usage. You can control cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this policy from time to time. Continued use of the service after changes means you accept the updated policy.
          </p>
        </section>
      </div>
    </main>
  );
}
