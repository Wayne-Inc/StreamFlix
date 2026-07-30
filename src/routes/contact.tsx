import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/streamflix/Logo";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — StreamFlix" },
      { name: "description", content: "Contact StreamFlix support." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
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
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-lg">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Contact</p>
          <h1 className="text-2xl sm:text-4xl font-black">Get in Touch</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Have a question, concern, or feedback? We'd love to hear from you. Reach out using the information below and we'll get back to you as soon as possible.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">General Inquiries</h2>
          <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground space-y-2">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@streamflix.app" className="text-primary hover:underline">support@streamflix.app</a>
            </p>
                        
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Support Hours</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our support team aims to respond to all inquiries within 24–48 hours during regular business days. For urgent matters, please include "URGENT" in your email subject line.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Creator</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This project was created by <strong>Samwel Wayne</strong>. For legal or business inquiries, please refer to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Report an Issue</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you encounter a technical issue, bug, or security concern, please email us with as much detail as possible, including steps to reproduce the issue and your browser/device information.
          </p>
        </section>
      </div>
    </main>
  );
}
