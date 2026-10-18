import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, WandSparkles } from "lucide-react";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Navbar } from "@/components/streamflix/Navbar";
import { askStreamflixAI } from "@/lib/api/ai";
import { getWatchHistory } from "@/lib/continue-watching";
import { auth } from "@/lib/firebase";
import { isKidsProfile } from "@/lib/kids-mode";
import type { Movie } from "@/lib/types";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  recommendations?: { movie: Movie; reason: string }[];
};

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — StreamFlix" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const kidsMode = useMemo(() => isKidsProfile(), []);
  const [prompt, setPrompt] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: kidsMode
        ? "Hi! Tell me what kind of family-friendly movie or show you’re in the mood for."
        : "Hi! Tell me what you’re in the mood for, and I’ll find movies and shows that fit.",
    },
  ]);

  const historyForRequest = () => {
    if (!includeHistory || kidsMode) return [];
    return getWatchHistory()
      .slice(0, 12)
      .map((item) => ({ title: item.title, genres: (item.genres ?? []).slice(0, 8) }));
  };

  const send = async (text: string, mode: "chat" | "recommendations" = "chat") => {
    const request = text.trim();
    if (busy || (!request && mode === "chat")) return;
    const userMessage: AssistantMessage | null = request ? { role: "user", content: request } : null;
    const previous = messages;
    if (userMessage) setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setError("");
    setBusy(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Please sign in again to use the AI assistant.");
      const result = await askStreamflixAI({
        data: {
          idToken,
          mode,
          prompt: request || "Recommend a few titles for me.",
          includeHistory: includeHistory && !kidsMode,
          watchHistory: historyForRequest(),
          kidsMode,
          conversation: previous
            .slice(-6)
            .map(({ role, content }) => ({ role, content })),
        },
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message, recommendations: result.recommendations },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant couldn't respond. Try again.");
      if (userMessage) {
        setMessages((current) => current.filter((message, index) => index !== current.length - 1 || message !== userMessage));
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(prompt);
  };

  const suggestions = kidsMode
    ? ["A funny animated movie", "An animal adventure", "A cozy family show"]
    : ["A clever mystery without too much violence", "Something uplifting and under two hours", "A sci-fi show with great characters"];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-8 md:pt-28">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-2xl sm:p-9">
          <div className="absolute -right-10 -top-16 size-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <WandSparkles className="size-6" />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">StreamFlix AI</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your next favorite starts here.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Describe a mood, a plot, or the kind of night you’re planning. Get grounded picks from the StreamFlix catalog, with a reason for every match.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/70 shadow-xl">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary"><Bot className="size-5" /></div>
            <div>
              <h2 className="text-sm font-semibold">Movie & TV guide</h2>
              <p className="text-xs text-muted-foreground">Powered by NVIDIA Nemotron</p>
            </div>
            <Sparkles className="ml-auto size-4 text-primary" />
          </div>

          <div className="max-h-[52vh] min-h-72 space-y-5 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={message.role === "user" ? "ml-auto max-w-[90%] sm:max-w-[75%]" : "max-w-full"}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto w-fit bg-primary text-primary-foreground" : "border border-border bg-background/70 text-foreground"}`}>
                  {message.content}
                </div>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {message.recommendations.map(({ movie, reason }) => (
                      <div key={movie.id}>
                        <MovieCard movie={movie} fluid />
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Finding a great match…</div>}
            {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          </div>

          <div className="border-t border-border bg-background/50 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" disabled={busy} onClick={() => void send(suggestion)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50">
                  {suggestion}
                </button>
              ))}
              <button type="button" disabled={busy} onClick={() => void send("", "recommendations")} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50">
                Surprise me
              </button>
            </div>
            <form onSubmit={submit} className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/60">
              <label className="sr-only" htmlFor="assistant-prompt">Describe what you want to watch</label>
              <textarea id="assistant-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={500} rows={2} placeholder="I want a mind-bending mystery for tonight…" className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
              <button type="submit" disabled={busy || !prompt.trim()} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" /></button>
            </form>
            <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <label className={`inline-flex items-center gap-2 ${kidsMode ? "opacity-50" : ""}`}>
                <input type="checkbox" checked={includeHistory && !kidsMode} disabled={kidsMode} onChange={(event) => setIncludeHistory(event.target.checked)} className="accent-primary" />
                Use my watch history for better picks
              </label>
              <span>Your history is sent only when you opt in. AI responses may be imperfect.</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
