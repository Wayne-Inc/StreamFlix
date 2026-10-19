import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Send, Sparkles } from "lucide-react";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Navbar } from "@/components/streamflix/Navbar";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: kidsMode
        ? "Hi! Tell me what kind of family-friendly movie or show you’re in the mood for."
        : "Hi! Tell me what you’re in the mood for, and I’ll find movies and shows that fit.",
    },
  ]);

  const hasConversation = messages.length > 1;

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
  }, [messages, busy, error]);

  const historyForRequest = () => {
    if (kidsMode) return [];
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
          includeHistory: true,
          watchHistory: historyForRequest(),
          kidsMode,
          conversation: previous
            .slice(-6)
            .map(({ role, content }) => ({ role, content })),
        },
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message },
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
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col pt-14 sm:pt-16 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <div
          ref={threadRef}
          className="min-h-0 flex-1 overflow-y-auto"
          aria-live="polite"
        >
          {!hasConversation ? (
            <div className="flex min-h-full flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
              <div className="mb-5 grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-8" />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">StreamFlix AI</p>
              <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">Your next favorite starts here.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {messages[0]?.content}
              </p>
              <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send("", "recommendations")}
                  className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  Surprise me
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
              {messages.slice(1).map((message, index) => (
                <div key={`${index}-${message.role}`} className={message.role === "user" ? 'ml-auto max-w-[90%] sm:max-w-[80%]' : 'mr-auto max-w-[90%] sm:max-w-[80%]'}>
                  <div className={message.role === "user" ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "rounded-xl bg-muted/50 p-4"}>
                    <div className="space-y-2">
                      <div className="text-sm leading-6">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" /> Finding a great match…
                </div>
              )}
              {error && (
                <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>
              )}
            </div>
          )}
        </div>

      </main>

      <div className="pointer-events-none shrink-0 bg-gradient-to-t from-background via-background/85 to-transparent px-4 pb-4 pt-6 sm:px-8">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl">
          {hasConversation && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => void send("", "recommendations")}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-md transition hover:bg-primary/20 disabled:opacity-50"
              >
                Surprise me
              </button>
            </div>
          )}
          <form
            onSubmit={submit}
            className="flex items-end gap-2 rounded-[1.75rem] border border-white/10 bg-card/80 p-2 pl-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl focus-within:border-primary/50"
          >
            <label className="sr-only" htmlFor="assistant-prompt">Describe what you want to watch</label>
            <textarea
              id="assistant-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="I want a mind-bending mystery for tonight…"
              className="max-h-32 min-h-12 flex-1 resize-none overflow-hidden bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              style={{ resize: "none" }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={busy || !prompt.trim()}
              aria-label="Send message"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
