import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ChevronRight, Play, ChevronDown, Mail, Instagram, Tv, Smartphone, Monitor, Shield, Zap, Globe, ChevronLeft } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import { ContactEmail } from "@/components/streamflix/ContactEmail";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollBy = (dir: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Hero */}
      <section className="relative min-h-[50vh] sm:min-h-[88vh] overflow-hidden">
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
          <div className="relative mt-6">
            {canScrollLeft && (
              <button
                onClick={() => scrollBy(-1)}
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-full bg-background/80 border border-border backdrop-blur-sm shadow-lg hover:bg-accent transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-8 overflow-visible pb-2 pl-4 scrollbar-hide"
            >
              {trending.map((m, i) => (
                <div key={m.id} className="shrink-0 relative transition hover:scale-105">
                  <span className="absolute bottom-6 -left-5 text-7xl sm:text-8xl font-black leading-none select-none z-10" style={{ WebkitTextStroke: "3px rgba(255,255,255,0.6)", WebkitTextFillColor: "transparent" }}>
                    {i + 1}
                  </span>
                  <Link
                    to="/browse"
                    className="block overflow-hidden rounded-lg relative"
                  >
                    <img
                      src={m.poster || "/placeholder.svg"}
                      alt={m.title}
                      className="h-60 w-40 object-cover sm:h-72 sm:w-52"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100" />
                  </Link>
                </div>
              ))}
            </div>
            {canScrollRight && (
              <button
                onClick={() => scrollBy(1)}
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-full bg-background/80 border border-border backdrop-blur-sm shadow-lg hover:bg-accent transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
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

      {/* Features */}
      <section className="border-y-8 border-black bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            Why StreamFlix?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Everything you love about streaming, minus the subscription fee.
          </p>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            <FeatureCard
              icon={<Play className="size-6" />}
              title="Instant Streaming"
              description="Hit play and start watching instantly. No buffering, no waiting — just smooth playback on any device."
            />
            <FeatureCard
              icon={<Globe className="size-6" />}
              title="Watch Anywhere"
              description="Works on your phone, tablet, laptop, or TV. Sign in once and pick up where you left off on any device."
            />
            <FeatureCard
              icon={<Shield className="size-6" />}
              title="Kids Safe"
              description="Built-in parental controls with Kids profiles that filter age-inappropriate content automatically."
            />
            <FeatureCard
              icon={<Tv className="size-6" />}
              title="Movies & TV"
              description="Thousands of movies and TV episodes across every genre — from blockbusters to hidden gems."
            />
            <FeatureCard
              icon={<Zap className="size-6" />}
              title="Smart Recommendations"
              description="AI-powered suggestions that learn what you love and surface titles you won't want to miss."
            />
            <FeatureCard
              icon={<Smartphone className="size-6" />}
              title="Mobile Apps"
              description="Download the Android app for a native experience with offline support and notifications."
            />
          </div>
        </div>
      </section>

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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-primary/40 hover:bg-card/80">
      <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
