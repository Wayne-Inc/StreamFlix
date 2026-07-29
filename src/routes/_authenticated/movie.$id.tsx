import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Plus, ThumbsUp, Share2, Star, Eye, ExternalLink, Settings2, Upload, WandSparkles, EyeOff, Clapperboard, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { Row } from "@/components/streamflix/Row";
import { Skeleton } from "@/components/ui/skeleton";
import { movieById, loadSimilar } from "@/lib/streamflix-data";
import { fetchTraktSummary, rateMovie, markAsWatched, addToWatchlist, removeFromWatchlist } from "@/lib/api/trakt";
import { discoverByGenre } from "@/lib/api/tmdb";
import { getVideoSource } from "@/lib/video-sources";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { supabase } from "@/lib/supabase";
import { isInMyList, addToMyList, removeFromMyList } from "@/lib/my-list";
import { getUserRating, rateMovie as saveRating } from "@/lib/ratings";
import { StarRating } from "@/components/streamflix/StarRating";
import { SeasonEpisodeSelector } from "@/components/streamflix/SeasonEpisodeSelector";
import { TrailerModal } from "@/components/streamflix/TrailerModal";

function MovieSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden bg-surface/50">
        <div className="flex h-full items-end md:items-center px-4 sm:px-8 md:px-16 pb-16 md:pb-0">
          <div className="max-w-2xl space-y-4 w-full">
            <Skeleton className="h-14 w-full max-w-md rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <Skeleton className="h-16 w-full max-w-xl rounded" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-24 rounded-md" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="size-12 rounded-full" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
          <div>
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/movie/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const extraGenres = ["27", "878", "35", "53"];
    const [movie, similar, trakt, ...genreResults] = await Promise.all([
      movieById(params.id),
      loadSimilar(params.id),
      fetchTraktSummary({ data: { id: params.id } }),
      ...extraGenres.map((g) => discoverByGenre({ data: { genreId: g } })),
    ]);
    if (!movie) throw notFound();
    const genreRows = extraGenres.map((g, i) => ({ genreId: g, items: (genreResults[i] || []).filter((m: any) => m.id !== params.id).slice(0, 12) }));
    return { movie, similar, trakt, genreRows };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.movie.title ?? "Movie"} — StreamFlix` },
      { name: "description", content: loaderData?.movie.description },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-dvh place-items-center bg-background">
      <p className="text-muted-foreground">Title not found.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-dvh place-items-center bg-background">
      <p className="text-muted-foreground">Something went wrong.</p>
    </div>
  ),
  component: MoviePage,
  pendingComponent: MovieSkeleton,
});

function MoviePage() {
  const { movie, similar, trakt, genreRows } = Route.useLoaderData();
  const genreLabels: Record<string, string> = { "27": "Horror", "878": "Sci-Fi", "35": "Comedy", "53": "Thriller", "28": "Action", "12": "Adventure", "18": "Drama", "10749": "Romance", "9648": "Mystery" };
  const fmtNum = (n: number | null) => (n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUrl, setAdminUrl] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);

  const handleRating = async (rating: number) => {
    const user = auth.currentUser;
    if (!user) { toast.error("Sign in to rate"); return; }
    try {
      await saveRating(user.uid, movie.id, rating);
      setUserRating(rating);
      toast.success(`Rated ${rating}/10`);
    } catch (e: any) { toast.error(e.message); }
  };
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subtitles, setSubtitles] = useState<{ lang: string; label: string; url: string }[]>([]);
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [subtitleUrl, setSubtitleUrl] = useState("");

  useEffect(() => {
    getVideoSource(movie.id).then((src) => {
      if (src?.video_url) { setAdminUrl(src.video_url); }
      if (src?.subtitles) { setSubtitles(src.subtitles); }
    });
    isInMyList(movie.id).then(setInWatchlist);
    getUserRating(movie.id).then(setUserRating);
  }, [movie.id]);

  const handleWatchlist = async () => {
    const conn = getTrakt();
    try {
      if (inWatchlist) {
        await removeFromMyList(movie.id);
        setInWatchlist(false);
        toast.success("Removed from My List");
        if (conn) {
          try {
            await removeFromWatchlist({ data: { token: conn.accessToken, tmdbId: movie.id } });
            toast.success("Removed from Trakt watchlist");
          } catch (e: any) {
            toast.error(e.message || "Failed to remove from Trakt watchlist");
          }
        }
      } else {
        await addToMyList({ id: movie.id, title: movie.title, year: movie.year, poster: movie.poster });
        setInWatchlist(true);
        toast.success("Added to My List");
        if (conn) {
          try {
            await addToWatchlist({ data: { token: conn.accessToken, tmdbId: movie.id } });
            toast.success("Added to Trakt watchlist");
          } catch (e: any) {
            toast.error(e.message || "Failed to add to Trakt watchlist");
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTrakt = () => {
    const raw = localStorage.getItem("streamflix:trakt");
    if (!raw) { toast.error("Connect Trakt in Settings first"); return null; }
    const conn = JSON.parse(raw);
    if (conn.expiresAt && Date.now() > conn.expiresAt) {
      toast.error("Trakt token expired. Disconnect and reconnect in Settings.");
      return null;
    }
    return conn;
  };

  const handleLike = async () => {
    const conn = getTrakt();
    if (!conn) return;
    try {
      await rateMovie({ data: { token: conn.accessToken, tmdbId: movie.id, rating: liked ? 1 : 10 } });
      setLiked(!liked);
      toast.success(liked ? "Unliked" : "Liked!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkWatched = async () => {
    const conn = getTrakt();
    if (!conn) return;
    try {
      await markAsWatched({ data: { token: conn.accessToken, tmdbId: movie.id } });
      setWatched(true);
      toast.success("Marked as watched");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    const path = `${movie.id}_${Date.now()}_${file.name}`;
    const contentType = file.type || "application/octet-stream";
    try {
      const { error } = await supabase.storage.from("movie_videos").upload(path, file, {
        upsert: true,
        contentType,
      });
      if (error) {
        if (error.message?.includes("bucket") || error.message?.includes("not found")) {
          toast.error("Supabase bucket 'movie_videos' not found. Create it in Supabase Storage dashboard.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      const { data: urlData } = supabase.storage.from("movie_videos").getPublicUrl(path);
      setAdminUrl(urlData.publicUrl);
      toast.success("Upload complete");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("NetworkError")) {
        toast.error("Video upload failed: network error or Supabase is not reachable.");
      } else {
        toast.error(msg || "Failed to upload video");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubtitleUrlSubmit = async () => {
    if (!subtitleUrl.trim() || !subtitleLang.trim()) {
      toast.error("Enter a subtitle URL and language.");
      return;
    }
    if (!/^https?:\/\//i.test(subtitleUrl.trim())) {
      toast.error("Enter a valid http or https subtitle URL.");
      return;
    }

    setUploading(true);
    try {
      const lang = subtitleLang.trim().toLowerCase();
      const labels: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic", ru: "Russian", nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish", fi: "Finnish", no: "Norwegian", cs: "Czech", hu: "Hungarian", ro: "Romanian", el: "Greek", tr: "Turkish", th: "Thai", vi: "Vietnamese", hi: "Hindi" };
      const label = labels[lang] || lang.toUpperCase();
      const entry = { lang, label, url: subtitleUrl.trim() };
      const updated = [...subtitles.filter((s) => s.lang !== lang), entry];
      await setDoc(doc(db, "movie_sources", movie.id), { subtitles: updated }, { merge: true });
      setSubtitles(updated);
      setSubtitleUrl("");
      toast.success("Subtitle URL saved");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("NetworkError")) {
        toast.error("Subtitle URL save failed: network error or Supabase is not reachable.");
      } else {
        toast.error(msg || "Failed to save subtitle URL");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSubtitle = async (lang: string) => {
    try {
      const path = `subtitles/${movie.id}_${lang}.vtt`;
      await supabase.storage.from("movie_videos").remove([path]);
      const updated = subtitles.filter((s) => s.lang !== lang);
      await setDoc(doc(db, "movie_sources", movie.id), { subtitles: updated }, { merge: true });
      setSubtitles(updated);
      toast.success("Subtitle removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveVideoSource = async () => {
    if (!adminUrl.trim()) return;
    try {
      await setDoc(doc(db, "movie_sources", movie.id), {
        tmdb_id: movie.id,
        title: movie.title,
        video_url: adminUrl.trim(),
        type: "movie",
      }, { merge: true });
      toast.success("Video source saved");
      setShowAdmin(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden pt-16 md:pt-20">
        <img src={movie.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 flex h-full flex-col pb-8 md:pb-16 px-4 sm:px-8 md:px-16">
          {/* Title, metadata, description at top */}
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-emerald-400">{movie.match}% Match</span>
              <span className="text-muted-foreground">{movie.year}</span>
              <span className="rounded border border-border px-1.5 text-muted-foreground">{movie.rating}</span>
              <span className="text-muted-foreground">{movie.runtime}</span>
            </div>
            <div className={descExpanded ? "max-h-32 overflow-y-auto" : ""}>
              <p className={`max-w-xl text-sm text-foreground/90 sm:text-base ${descExpanded ? "" : "line-clamp-3"}`}>{movie.description}</p>
              <button onClick={() => setDescExpanded((v) => !v)} className="mt-1 text-xs font-medium text-primary">{descExpanded ? "Show less" : "Show more"}</button>
            </div>
          </div>

          {/* Spacer pushes buttons to bottom */}
          <div className="flex-1 min-h-4" />

          {/* Play, Trailer, action buttons at bottom */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/watch/$id" params={{ id: movie.id }} search={{ autoplay: true }} className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-semibold text-background hover:bg-foreground/85">
                <Play className="size-5 fill-current" /> Play
              </Link>
              {movie.trailer && (
                <button onClick={() => setTrailerOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-semibold text-foreground hover:bg-white/10">
                  <Clapperboard className="size-5" /> Trailer
                </button>
              )}
              <button onClick={handleWatchlist} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={inWatchlist ? "Remove from list" : "Add to list"}>
                {inWatchlist ? <CheckCheck className="size-4 sm:size-5" /> : <Plus className="size-4 sm:size-5" />}
              </button>
              <button onClick={handleLike} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={liked ? "Unlike" : "Like"}>
                <ThumbsUp className={`size-4 sm:size-5 ${liked ? "fill-foreground" : ""}`} />
              </button>
              <button onClick={handleMarkWatched} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label={watched ? "Watched" : "Mark watched"}>
                {watched ? <EyeOff className="size-4 sm:size-5" /> : <Eye className="size-4 sm:size-5" />}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label="Share">
                <Share2 className="size-4 sm:size-5" />
              </button>
              <button onClick={() => setShowAdmin((v) => !v)} className="grid size-11 sm:size-12 place-items-center rounded-full border border-border hover:border-foreground" aria-label="Settings">
                <Settings2 className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {showAdmin && (
        <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Video Source ({movie.id})</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/..."
                className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button onClick={handleSaveVideoSource} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <WandSparkles className="mr-1.5 inline size-4" /> Save
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-card disabled:opacity-50"
              >
                <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload video"}
              </button>
            </div>

            <hr className="my-4 border-border" />
            <p className="mb-2 text-sm font-semibold text-foreground">Subtitles</p>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="ar">Arabic</option>
                  <option value="ru">Russian</option>
                  <option value="hi">Hindi</option>
                  <option value="nl">Dutch</option>
                  <option value="pl">Polish</option>
                  <option value="tr">Turkish</option>
                  <option value="th">Thai</option>
                  <option value="vi">Vietnamese</option>
                </select>
                <input
                  value={subtitleUrl}
                  onChange={(e) => setSubtitleUrl(e.target.value)}
                  placeholder="https://example.com/subtitles.vtt"
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleSubtitleUrlSubmit}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-card disabled:opacity-50"
                >
                  <ExternalLink className="size-4" /> {uploading ? "Saving…" : "Save URL"}
                </button>
              </div>
              {subtitles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {subtitles.map((sub) => (
                    <div key={sub.lang} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="rounded bg-card px-2 py-0.5 text-xs uppercase">{sub.lang}</span>
                      <span className="flex-1">{sub.label}</span>
                      <button
                        onClick={() => handleRemoveSubtitle(sub.lang)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-3 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-5 text-sm min-w-0">
          {/* Cast with profile pics */}
          <div className="min-w-0">
            <p className="mb-3 text-base font-semibold text-foreground">Cast</p>
            <div
              className="flex flex-nowrap gap-3 overflow-x-auto pb-3 pr-3 scrollbar-hide sm:gap-4 w-full min-w-0"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", overscrollBehaviorX: "contain" }}
            >
              {movie.cast.map((name: string, i: number) => (
                <Link
                  key={name}
                  to="/search"
                  search={{ q: name, tab: "people" }}
                  className="flex min-w-[72px] flex-shrink-0 flex-col items-center gap-1.5 hover:opacity-80 transition w-[72px] sm:min-w-[80px] sm:w-20"
                >
                  <div className="size-12 sm:size-16 overflow-hidden rounded-full bg-surface ring-1 ring-border">
                    {movie.castPfp[i] ? (
                      <img src={movie.castPfp[i]} alt={name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-center text-muted-foreground leading-tight line-clamp-2">{name}</span>
                  {movie.castRoles?.[i] && (
                    <span className="text-[9px] sm:text-[10px] text-center text-muted-foreground leading-tight line-clamp-2">
                      {movie.castRoles[i]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Spacer pushes Director + Genres to bottom */}
          <div className="flex-1 min-h-4" />

          {/* Director */}
          <p>
            <span className="text-muted-foreground">Director: </span>
            <Link to="/search" search={{ q: movie.director, tab: "people" }} className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer">{movie.director}</Link>
          </p>

          {/* Genres as pills */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((name: string) => (
              <Link
                key={name}
                to="/search"
                search={{ q: name, tab: "genres" }}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground hover:bg-card hover:border-primary/50 transition cursor-pointer"
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Rate this */}
          <div>
            <p className="mb-2 text-base font-semibold text-foreground">Rate this</p>
            <StarRating rating={userRating} onRate={handleRating} />
          </div>

        </div>
        <div className="space-y-4 rounded-lg border border-border bg-surface p-3 text-xs sm:p-4 sm:text-sm h-auto sm:h-[340px]">
          <div>
            <p className="font-semibold text-foreground text-sm sm:text-base">About this title</p>
            <p className="mt-2 text-muted-foreground"></p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Genres:</span> {movie.genres.join(", ")}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Director:</span> {movie.director}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Cast:</span> {movie.cast.length} actors</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Released:</span> {movie.year}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Runtime:</span> {movie.runtime}</p>
              <p className="text-[11px] sm:text-sm"><span className="text-foreground">Rating:</span> {movie.rating}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Trakt</p>
              {trakt.url && (
                <a href={trakt.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-card/60 py-2">
                <Star className="mx-auto size-4 text-amber-400" />
                <div className="mt-1 font-semibold text-foreground">{trakt.rating != null ? trakt.rating.toFixed(1) : "—"}</div>
                <div className="text-[11px] text-muted-foreground">{fmtNum(trakt.votes)} votes</div>
              </div>
              <div className="rounded bg-card/60 py-2">
                <Eye className="mx-auto size-4 text-sky-400" />
                <div className="mt-1 font-semibold text-foreground">{fmtNum(trakt.watchers)}</div>
                <div className="text-[11px] text-muted-foreground">watching</div>
              </div>
              <div className="rounded bg-card/60 py-2">
                <Play className="mx-auto size-4 text-emerald-400" />
                <div className="mt-1 font-semibold text-foreground">{fmtNum(trakt.plays)}</div>
                <div className="text-[11px] text-muted-foreground">plays</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {movie.numberOfSeasons && movie.numberOfSeasons > 0 && (
        <SeasonEpisodeSelector
          movieId={movie.id}
          numberOfSeasons={movie.numberOfSeasons}
        />
      )}

      {similar.length > 0 && (
        <div className="space-y-2">
          {(() => {
            const groups = new Map<string, typeof similar>();
            for (const m of similar) {
              const g = m.genres[0] || "Other";
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(m);
            }
            return Array.from(groups.entries()).map(([genre, items]) => (
              <Row key={genre} title={`More ${genre}`} items={items} />
            ));
          })()}
        </div>
      )}

      <div className="space-y-2 pb-10">
        {genreRows.map((gr) => {
          const label = genreLabels[gr.genreId] || "Others You May Like";
          return <Row key={gr.genreId} title={`${label} Movies`} items={gr.items} />;
        })}
      </div>

      {trailerOpen && movie.trailer && (
        <TrailerModal url={movie.trailer} onClose={() => setTrailerOpen(false)} />
      )}
      <Footer />
    </div>
  );
}