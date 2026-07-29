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
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-border bg-surface p-8 shadow-lg">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Terms of Service</p>
          <h1 className="text-4xl font-black">Welcome to StreamFlix</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            These Terms of Service govern your use of StreamFlix. By accessing or using the service, you agree to be bound by these terms.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Use of the Service</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            StreamFlix is provided for personal, non-commercial use only. You may not copy, distribute, sublicense, sell, or otherwise exploit any portion of the service without express written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Content and Availability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Content available through StreamFlix may change at any time. We do not guarantee that any title will remain accessible or that the service will be available without interruption.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Termination</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may suspend or terminate your access at any time for any reason, including violation of these terms or misuse of the platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Disclaimer</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Redistribution, reproduction, or public display of any part of this platform without the express written consent of Samwel Wayne is strictly prohibited. This includes, but is not limited to, copying, modifying, or re-uploading the software, design, or any content accessed through it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Changes to These Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.
          </p>
        </section>
      </div>
    </main>
  );
}
