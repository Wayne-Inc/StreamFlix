import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, RotateCcw, Send, Sparkles, TriangleAlert } from "lucide-react";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Navbar } from "@/components/streamflix/Navbar";
import { Checkbox } from "@/components/ui/checkbox";
import { askStreamflixAI } from "@/lib/api/ai";
import { AI_ERROR_MESSAGES, aiErrorMessage } from "@/lib/ai-errors";
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
  const [failedRequest, setFailedRequest] = useState<{
    text: string;
    mode: "chat" | "recommendations";
  } | null>(null);
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

  const send = async (
    text: string,
    mode: "chat" | "recommendations" = "chat",
    options?: { keepUserMessage?: boolean },
  ) => {
    const request = text.trim();
    if (busy || (!request && mode === "chat")) return;
    const userMessage: AssistantMessage | null =
      request && !options?.keepUserMessage ? { role: "user", content: request } : null;
    const previous = messages;
    if (userMessage) setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setError("");
    setFailedRequest(null);
    setBusy(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error(AI_ERROR_MESSAGES.auth);
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
      if (!result.ok) {
        setError(result.message);
        setFailedRequest({ text: request, mode });
        return;
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message, recommendations: result.recommendations },
      ]);
    } catch (cause) {
      setError(aiErrorMessage(cause));
      setFailedRequest({ text: request, mode });
      console.error("[StreamFlix AI] request failed", cause);
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
    <div className="flex h-[calc(100dvh-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col pt-14 sm:pt-16">
        <div
          ref={threadRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          aria-live="polite"
        >
          {!hasConversation ? (
            <div className="flex min-h-full flex-col items-center justify-center px-5 py-6 text-center sm:px-8 sm:py-10">
              <div className="mb-4 grid size-12 place-items-center rounded-full bg-primary/15 text-primary sm:mb-5 sm:size-16">
                <Sparkles className="size-6 sm:size-8" />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">StreamFlix AI</p>
              <h1 className="max-w-xl text-2xl font-black tracking-tight sm:text-5xl">Your next favorite starts here.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base">
                {messages[0]?.content}
              </p>
              <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2 sm:mt-8">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send("", "recommendations")}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Surprise me
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-8 sm:py-8">
              {messages.slice(1).map((message, index) => (
                <Fragment key={`${index}-${message.role}`}>
                  {message.role === "assistant" && message.recommendations && message.recommendations.length > 0 ? (
                    <>
                      <div className={message.role === "user" ? "ml-auto max-w-[90%] sm:max-w-[80%]" : "mr-auto max-w-[90%] sm:max-w-[80%]"}>
                        <div className={message.role === "user" ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "rounded-xl bg-muted/50 p-4"}>
                          <div className="space-y-2">
                            <div className="break-words whitespace-pre-wrap text-sm leading-6">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="-mx-4 mt-0 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:justify-center">
                        {message.recommendations.map((rec, recIndex) => (
                          <div key={rec.movie.id ?? recIndex} className="snap-start shrink-0">
                            <MovieCard movie={rec.movie} reason={rec.reason} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={message.role === "user" ? "ml-auto max-w-[90%] sm:max-w-[80%]" : "mr-auto max-w-[90%] sm:max-w-[80%]"}>
                      <div className={message.role === "user" ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "rounded-xl bg-muted/50 p-4"}>
                        <div className="space-y-2">
                          <div className="break-words whitespace-pre-wrap text-sm leading-6">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
              {busy && (
                <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground sm:max-w-[80%]">
                  <LoaderCircle className="size-4 animate-spin" /> Finding a great match…
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      <div className="pointer-events-none shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-8 md:pb-4">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl">
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 backdrop-blur-md"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <TriangleAlert className="size-4 shrink-0" />
                Something went wrong on our side
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{error}</p>
              {failedRequest && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void send(failedRequest.text, failedRequest.mode, { keepUserMessage: true })
                  }
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" /> Try again
                </button>
              )}
            </div>
          )}
          {hasConversation && (
            <div className="mb-2 flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide overscroll-x-contain sm:flex-wrap sm:overflow-visible">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(suggestion)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => void send("", "recommendations")}
                className="shrink-0 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-md transition hover:bg-primary/20 disabled:opacity-50"
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
              onChange={(event) => {
                setPrompt(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
              }}
              maxLength={500}
              rows={1}
              placeholder="I want a mind-bending mystery for tonight…"
              className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
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
