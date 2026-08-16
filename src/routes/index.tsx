import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Play, ChevronDown, Mail, Instagram } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { ContactEmail } from "@/components/streamflix/ContactEmail";
import { DownloadApp } from "@/components/streamflix/DownloadApp";
import { tmdbFetch, toMovie } from "@/lib/api/tmdb.server";
import type { Movie } from "@/lib/types";
import heroImg from "@/assets/landing.jpg";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { auth } = await import("@/lib/firebase");
    const { onAuthStateChanged } = await import("firebase/auth");
    const user = await new Promise<unknown>((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user);
      });
    });
    if (user) {
      throw redirect({ to: "/profiles" });
    }
  },
  loader: async () => {
    const data = await tmdbFetch("/trending/movie/week");
    return (data.results || []).slice(0, 10).map(toMovie);
  },
  head: () => ({
    meta: [
      { title: "StreamFlix — Unlimited movies, TV shows, and more" },
      {
        name: "description",
        content: "StreamFlix — Free streaming service. Unlimited movies, TV shows, and more.",
      },
      { property: "og:title", content: "StreamFlix" },
      {
        property: "og:description",
        content: "Unlimited movies, TV shows, and more — anywhere, anytime.",
      },
    ],
  }),
  component: Landing,
});

const faqs = [
  [
    "Is StreamFlix really free?",
    "Yes, 100% free. No subscriptions, no hidden fees, no credit card needed. Just sign up and start watching instantly.",
  ],
  [
    "Can I watch on my phone or TV?",
    "Absolutely. StreamFlix works on any device with an internet connection — phones, tablets, laptops, smart TVs, gaming consoles, and more.",
  ],
  [
    "Do I need to create an account?",
    "Yes, you'll need a free account to personalize your experience, pick up where you left off, and create watchlists. It takes seconds to sign up.",
  ],
  [
    "How is StreamFlix free?",
    "StreamFlix is supported by our community and partners. We believe entertainment should be accessible to everyone, so we keep it free with no strings attached.",
  ],
  [
    "What kind of content is available?",
    "From blockbuster movies and binge-worthy TV shows to anime, documentaries, and original content — there's something for everyone.",
  ],
];

function Landing() {
  const trending: Movie[] = Route.useLoaderData();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-background" />
        <div className="relative z-10">
          <header className="flex items-center justify-between px-4 sm:px-12 py-5">
            <Logo className="[&>span]:text-3xl [&>span]:sm:text-5xl" />
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="rounded-md bg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-primary-foreground hover:bg-primary/90 mr-0 sm:mr-12"
              >
                Sign In
              </Link>
            </div>
          </header>

          <div className="mx-auto mt-24 max-w-3xl px-4 text-center sm:mt-36">
            <h1 className="text-shadow-hero text-5xl font-black tracking-tight sm:text-7xl">
              Unlimited movies, TV shows, and more.
            </h1>
            <p className="text-shadow-hero mt-6 text-xl sm:text-3xl font-medium">
              Completely free. No subscriptions, no catches.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Play className="size-5 fill-current" /> Start Watching
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="bg-background py-12 sm:py-16">
        <div className="w-full px-4 sm:px-8">
          <h2 className="px-1 text-2xl font-bold sm:text-3xl">Trending Now</h2>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map((m) => (
              <Link
                key={m.id}
                to="/browse"
                className="shrink-0 overflow-hidden rounded-lg transition hover:scale-105 hover:ring-2 hover:ring-primary"
              >
                <img
                  src={m.poster || "/placeholder.svg"}
                  alt={m.title}
                  className="h-72 w-48 object-cover sm:h-80 sm:w-56"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Browse the full catalog <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Download the app */}
      <DownloadApp />

      {/* FAQ */}
      <section className="border-y-8 border-black bg-background py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-3">
            {faqs.map(([q, a], i) => (
              <FaqItem
                key={i}
                q={q}
                a={a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
          <div className="mt-14 text-center">
            <p className="text-lg sm:text-xl">Ready to watch? It's free — dive right in.</p>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Play className="size-5 fill-current" /> Start Watching
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-10 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-medium text-foreground">StreamFlix — Free for everyone.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <ContactEmail className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Mail className="size-4" />
            </ContactEmail>
            <a
              href="https://instagram.com/itiswayneee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Instagram className="size-4" /> @itiswayneee
            </a>
            <Link to="/tos" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="mt-6 text-xs">© {new Date().getFullYear()} StreamFlix</p>
        </div>
      </footer>
    </main>
  );
}

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left text-xl font-medium transition hover:bg-accent"
        aria-expanded={isOpen}
      >
        <span>{q}</span>
        <ChevronDown
          className={`size-6 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="px-8 pb-8 pt-2 text-lg text-muted-foreground leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}
