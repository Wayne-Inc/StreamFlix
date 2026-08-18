import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useRef, useState, useCallback, type MouseEvent, type TouchEvent } from "react";
import { ArrowLeft, Settings, Wifi, Loader, RotateCw, Users, ShieldOff, Play, Copy, Check, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { movieById } from "@/lib/streamflix-data";
import { getContinueWatching, recordProgress } from "@/lib/continue-watching";
import { saveProgressToFirestore } from "@/lib/continue-watching-firestore";
import { getVideoSource } from "@/lib/video-sources";
import { probeEmbedUrl, fetchTvSeason } from "@/lib/api/tmdb";
import { resolveVidNestStreams, type VidNestStream } from "@/lib/api/vidnest";
import { auth } from "@/lib/firebase";
import { startSession, endSession } from "@/lib/session-tracking";
import { toast } from "sonner";
import { SeasonEpisodePicker } from "@/components/streamflix/SeasonEpisodePicker";
import { seoMetaFor } from "@/lib/seo";
import { MAIN_VIDEO_URL } from "@/lib/constants";
import { isKidsProfile, isRatingBlockedForKids, isGenreBlockedForKids } from "@/lib/kids-mode";

interface NetworkInformation {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

const watchSearchSchema = z.object({
  season: z.number().optional(),
  episode: z.number().optional(),
  autoplay: z.boolean().optional(),
});

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface EmbedServer {
  id: string;
  name: string;
  isFrench: boolean;
  urls: {
    movie: string;
    tv: string;
  };
}

const availableEmbedServers: EmbedServer[] = [
  {
    id: "vidking",
    name: "VidKing",
    isFrench: false,
    urls: {
      movie: "https://www.vidking.net/embed/movie/{id}?color=e50914&autoPlay=true",
      tv: "https://www.vidking.net/embed/tv/{id}/{season}/{episode}?color=e50914&autoPlay=true&nextEpisode=true",
    },
  },
  {
    id: "vsembed",
    name: "VSEmbed",
    isFrench: false,
    urls: {
      movie: "https://vsembed.su/embed/movie/{id}",
      tv: "https://vsembed.su/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    isFrench: false,
    urls: {
      movie: "https://player.autoembed.cc/embed/movie/{id}",
      tv: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "2embed",
    name: "2Embed",
    isFrench: false,
    urls: {
      movie: "https://www.2embed.cc/embed/{id}",
      tv: "https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}",
    },
  },
  {
    id: "primewire",
    name: "PrimeWire",
    isFrench: false,
    urls: {
      movie: "https://www.primewire.tf/embed/movie?tmdb={id}",
      tv: "https://www.primewire.tf/embed/tv?tmdb={id}&season={season}&episode={episode}",
    },
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    isFrench: false,
    urls: {
      movie: "https://multiembed.mov/?video_id={id}&tmdb=1",
      tv: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
    },
  },
  {
    id: "videasy",
    name: "VidEasy",
    isFrench: false,
    urls: {
      movie: "https://player.videasy.net/movie/{id}",
      tv: "https://player.videasy.net/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    isFrench: false,
    urls: {
      movie: "https://embed.smashystream.com/playere.php?tmdb={id}",
      tv: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}",
    },
  },
  {
    id: "pstream",
    name: "P-Stream",
    isFrench: false,
    urls: {
      movie: "https://iframe.pstream.org/embed/tmdb-movie-{id}",
      tv: "https://iframe.pstream.org/embed/tmdb-tv-{id}/{season}/{episode}",
    },
  },
  {
    id: "vidsrccc",
    name: "VidSrc.cc",
    isFrench: false,
    urls: {
      movie: "https://vidsrc.cc/v2/embed/movie/{id}",
      tv: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "embedsu",
    name: "Embed.su",
    isFrench: false,
    urls: {
      movie: "https://embed.su/embed/movie/{id}",
      tv: "https://embed.su/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "vidsrcto",
    name: "VidSrc.to",
    isFrench: false,
    urls: {
      movie: "https://vidsrc.to/embed/movie/{id}",
      tv: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "vidsrcrip",
    name: "VidSrc.rip",
    isFrench: false,
    urls: {
      movie: "https://vidsrc.rip/embed/movie/{id}",
      tv: "https://vidsrc.rip/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "vidsrcsu",
    name: "VidSrc.su",
    isFrench: false,
    urls: {
      movie: "https://vidsrc.su/embed/movie/{id}",
      tv: "https://vidsrc.su/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "vidsrcvip",
    name: "VidSrc.vip",
    isFrench: false,
    urls: {
      movie: "https://vidsrc.vip/embed/movie/{id}",
      tv: "https://vidsrc.vip/embed/tv/{id}/{season}/{episode}",
    },
  },
  {
    id: "frembed",
    name: "Frembed",
    isFrench: true,
    urls: {
      movie: "https://frembed.cc/api/film.php?id={id}",
      tv: "https://frembed.cc/api/serie.php?id={id}&sa={season}&epi={episode}",
    },
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    isFrench: false,
    urls: {
      movie: "https://moviesapi.club/movie/{id}",
      tv: "https://moviesapi.club/tv/{id}-{season}-{episode}",
    },
  },
  {
    id: "direct",
    name: "Direct",
    isFrench: false,
    urls: {
      movie: "",
      tv: "",
    },
  },
];

const embedHostnames = new Set(
  availableEmbedServers.map((server) => {
    try {
      return new URL(server.urls.movie).hostname;
    } catch {
      return server.urls.movie;
    }
  }),
);

function buildEmbedUrl(
  serverId: string,
  movieId: string,
  season: number | undefined,
  episode: number | undefined,
) {
  const server =
    availableEmbedServers.find((item) => item.id === serverId) ?? availableEmbedServers[0];
  const isTv = movieId.startsWith("tv-");
  const tmdbId = isTv ? movieId.slice(3) : movieId;
  const template = isTv ? server.urls.tv : server.urls.movie;
  return template
    .replace("{id}", tmdbId)
    .replace("{season}", season != null ? String(season) : "")
    .replace("{episode}", episode != null ? String(episode) : "");
}

function isEmbedUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return embedHostnames.has(hostname);
  } catch {
    return false;
  }
}

type EmbedPlaybackCommand = "handshake" | "play" | "pause" | "seek" | "requestProgress";

type EmbedPlaybackMessage = {
  type: "STREAMFLIX_EMBED_PLAYBACK";
  command: EmbedPlaybackCommand;
  time?: number;
};

type EmbedPlaybackResponse = {
  type: "STREAMFLIX_EMBED_PROGRESS" | "STREAMFLIX_EMBED_READY";
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
};

function sendEmbedPlaybackCommand(
  iframe: HTMLIFrameElement | null,
  command: EmbedPlaybackCommand,
  time?: number,
) {
  if (!iframe?.contentWindow) return;
  const message: EmbedPlaybackMessage = {
    type: "STREAMFLIX_EMBED_PLAYBACK",
    command,
  };
  if (typeof time === "number") message.time = time;
  iframe.contentWindow.postMessage(message, "*");
}

function PlayerPage() {
  const data = Route.useLoaderData();
  const movie = data?.movie;
  const { season, episode, autoplay } = Route.useSearch();

  const kidsMode = isKidsProfile();

  const [videoUrl, setVideoUrl] = useState<string>("");
  const mainVideoUrlRef = useRef<string>("");
  const [mainVideoUrl, setMainVideoUrl] = useState("");
  const [selectedServerId, setSelectedServerId] = useState<string>(() => {
    if (typeof window === "undefined") return "vidking";
    try {
      return localStorage.getItem("sf:embedServer") || "vidking";
    } catch {
      return "vidking";
    }
  });
  const selectedServer =
    availableEmbedServers.find((server) => server.id === selectedServerId) ??
    availableEmbedServers[0];

  const [currentTime, setCurrentTime] = useState(0);
  const [mainSourceReady, setMainSourceReady] = useState(false);
  const resumedRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedSyncSupported, setEmbedSyncSupported] = useState(false);
  const lastEmbedProgressRef = useRef(0);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);


  const navigate = useNavigate();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [ended, setEnded] = useState(false);
  const [subtitles, setSubtitles] = useState<{ lang: string; label: string; url: string }[]>([]);
  const [buffering, setBuffering] = useState(false);
  const [showRotateHint, setShowRotateHint] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      window.innerHeight > window.innerWidth,
  );
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Direct stream (VidNest) state
  const [directStreams, setDirectStreams] = useState<VidNestStream[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [activeDirectStream, setActiveDirectStream] = useState<number>(0);
  const [directPlaying, setDirectPlaying] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const hlsRef = useRef<any>(null);
  const directVideoRef = useRef<HTMLVideoElement>(null);
  const directContainerRef = useRef<HTMLDivElement>(null);
  const [directCurrentTime, setDirectCurrentTime] = useState(0);
  const [directDuration, setDirectDuration] = useState(0);
  const [directProgress, setDirectProgress] = useState(0);
  const [directPlayingState, setDirectPlayingState] = useState(false);
  const [directBuffering, setDirectBuffering] = useState(false);
  const [directEnded, setDirectEnded] = useState(false);
  const [directShowControls, setDirectShowControls] = useState(true);
  const directHideTimer = useRef<number | null>(null);
  const [directVolume, setDirectVolume] = useState(1);
  const [directMuted, setDirectMuted] = useState(false);
  const triedDirectRef = useRef<Set<number>>(new Set());

  const isTv = movie.id.startsWith("tv-");
  const [autoplayNext, setAutoplayNext] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sf:autoplayNext") === "1";
    } catch {
      return false;
    }
  });
  const [nextEp, setNextEp] = useState<{ season: number; episode: number } | null>(null);
  const embedEndedFiredRef = useRef(false);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const tryNextDirect = useCallback(() => {
    const next = activeDirectStream + 1;
    if (next < directStreams.length && !triedDirectRef.current.has(activeDirectStream)) {
      triedDirectRef.current.add(activeDirectStream);
      setActiveDirectStream(next);
    } else {
      setDirectEnded(true);
      toast.error("All direct streams failed.");
    }
  }, [activeDirectStream, directStreams.length]);

  const handleServerSelect = useCallback((id: string) => {
    setSelectedServerId(id);
    setDirectPlaying(false);
    setDirectStreams([]);
    setDirectEnded(false);
    setActiveDirectStream(0);
    triedDirectRef.current.clear();
    destroyHls();
    try {
      localStorage.setItem("sf:embedServer", id);
    } catch {}
  }, [destroyHls]);

  const toggleAutoplayNext = useCallback(() => {
    setAutoplayNext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sf:autoplayNext", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    embedEndedFiredRef.current = false;
  }, [movie.id, season, episode]);

  useEffect(() => {
    if (!isTv || season == null || episode == null) {
      setNextEp(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const tmdbId = movie.id.replace(/^tv-/, "");
      let epsInSeason = 0;
      try {
        const seasonData = await fetchTvSeason({ data: { id: tmdbId, season } });
        epsInSeason = (seasonData.episodes || []).length;
      } catch {}
      if (cancelled) return;
      if (epsInSeason > 0 && episode < epsInSeason) {
        setNextEp({ season, episode: episode + 1 });
      } else if (
        epsInSeason > 0 &&
        episode >= epsInSeason &&
        season < (movie.numberOfSeasons ?? season)
      ) {
        setNextEp({ season: season + 1, episode: 1 });
      } else {
        setNextEp(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movie.id, movie.numberOfSeasons, season, episode, isTv]);

  const goToNextEpisode = useCallback(() => {
    if (!nextEp) return;
    navigate({
      to: "/watch/$id",
      params: { id: movie.id },
      search: { season: nextEp.season, episode: nextEp.episode, autoplay: true },
    });
  }, [nextEp, movie.id, navigate]);

  const handleVideoEnded = useCallback(() => {
    setEnded(true);
    if (autoplayNext && isTv) goToNextEpisode();
  }, [autoplayNext, isTv, goToNextEpisode]);

  const goBack = useCallback(() => {
    try {
      screen.orientation?.unlock();
    } catch {}
    destroyHls();
    navigate({ to: "/movie/$id", params: { id: movie.id } });
  }, [navigate, movie.id, destroyHls]);

  const wake = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleWakeTap = useCallback(
    (event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      wake();
    },
    [wake],
  );

  useEffect(() => {
    wake();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [wake]);

  const lastSaveErrorAtRef = useRef(0);
  const notifySaveError = useCallback((err?: unknown) => {
    const now = Date.now();
    if (now - lastSaveErrorAtRef.current < 30_000) return;
    lastSaveErrorAtRef.current = now;
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Couldn't save your progress. Check your connection.";
    toast.error(message);
  }, []);

  const doRecord = useCallback(
    (cur: number, dur: number) => {
      recordProgress(movie, cur, dur);
      saveProgressToFirestore(movie, cur, dur).catch(notifySaveError);
    },
    [movie, notifySaveError],
  );

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const lastTapRef = useRef(0);
  const lastTapXRef = useRef(0);

  const onContainerTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current || !videoRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const now = Date.now();
      const timeSince = now - lastTapRef.current;
      const distSince = Math.abs(x - lastTapXRef.current);

      if (timeSince < 300 && distSince < 40) {
        e.preventDefault();
        if (x < rect.width / 2) {
          videoRef.current.currentTime -= 10;
        } else {
          videoRef.current.currentTime += 10;
        }
        lastTapRef.current = 0;
      } else {
        setShowControls((v) => !v);
        lastTapRef.current = now;
        lastTapXRef.current = x;
      }
      wake();
    },
    [wake],
  );

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const targetTotal = (Number(e.target.value) / 100) * v.duration;
    v.currentTime = targetTotal;
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
  };

  const updateSubtitleTracks = useCallback((lang: string | null, enabled: boolean) => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (!enabled) {
        track.mode = "disabled";
      } else {
        track.mode = lang && track.language === lang ? "showing" : "disabled";
      }
    }
  }, []);

  const handleSubtitleChange = (lang: string | null) => {
    setActiveSubtitle(lang);
    if (lang === null) {
      setCaptionsEnabled(false);
      updateSubtitleTracks(null, false);
      return;
    }
    updateSubtitleTracks(lang, captionsEnabled);
  };

  useEffect(() => {
    updateSubtitleTracks(activeSubtitle, captionsEnabled);
  }, [activeSubtitle, captionsEnabled, updateSubtitleTracks]);

  const toggleCaptions = useCallback(() => {
    setCaptionsEnabled((prev) => {
      const next = !prev;
      updateSubtitleTracks(activeSubtitle, next);
      return next;
    });
  }, [activeSubtitle, updateSubtitleTracks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.connection) return;
    const conn = navigator.connection;
    const update = () => setConnectionQuality(conn.effectiveType ?? null);
    update();
    conn.addEventListener("change", update);
    return () => conn.removeEventListener("change", update);
  }, []);


  // server fallback: probe all embed servers once on load; if the default
  // server is unreachable, switch to the first responding one.
  const probedRef = useRef(false);
  useEffect(() => {
    if (probedRef.current) return;
    probedRef.current = true;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        availableEmbedServers.map(async (s) => ({
          id: s.id,
          ok: await probeEmbedUrl({
            data: { url: buildEmbedUrl(s.id, movie.id, season, episode) },
          }),
        })),
      );
      if (cancelled) return;
      const live = results.find((r) => r.ok);
      const currentOk = results.find((r) => r.id === selectedServerId)?.ok;
      if (live && !currentOk) {
        const liveServer = availableEmbedServers.find((s) => s.id === live.id);
        setSelectedServerId(live.id);
        toast.warning(
          `"${selectedServer.name}" was unreachable — switched to ${liveServer?.name ?? live.id}`,
        );
      } else if (!currentOk) {
        toast.error(`${selectedServer.name} is unreachable. Try a different server below.`);
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // probedRef guard ensures this runs once regardless of deps
  }, [movie.id]);

  useEffect(() => {
    let sid: string | null = null;
    startSession(movie.id).then((id) => {
      sid = id;
      setSessionId(id);
    });
    return () => {
      if (sid) endSession(sid).catch(() => {});
    };
  }, [movie.id]);

  useEffect(() => {
    if (selectedServerId === "direct") return;
    const url = buildEmbedUrl(selectedServerId, movie.id, season, episode);
    setVideoUrl(url);
    setMainVideoUrl(url);
    mainVideoUrlRef.current = url;
    setEmbedSyncSupported(false);
  }, [selectedServerId, movie.id, season, episode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const data = event.data as EmbedPlaybackResponse | null;
      if (!data?.type) return;

      if (data.type === "STREAMFLIX_EMBED_READY") {
        setEmbedSyncSupported(true);
        return;
      }

      if (data.type === "STREAMFLIX_EMBED_PROGRESS") {
        if (typeof data.currentTime !== "number" || typeof data.duration !== "number") return;
        setCurrentTime(data.currentTime);
        setDuration(data.duration);

        const elapsed = Math.abs(data.currentTime - lastEmbedProgressRef.current);
        if (elapsed >= 5 || data.currentTime === 0) {
          lastEmbedProgressRef.current = data.currentTime;
          recordProgress(movie, data.currentTime, data.duration, season, episode);
          saveProgressToFirestore(movie, data.currentTime, data.duration, season, episode).catch(
            notifySaveError,
          );
        }

        if (
          embedSyncSupported &&
          autoplayNext &&
          isTv &&
          data.duration > 0 &&
          data.currentTime / data.duration >= 0.98 &&
          !embedEndedFiredRef.current
        ) {
          embedEndedFiredRef.current = true;
          goToNextEpisode();
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    movie,
    season,
    episode,
    embedSyncSupported,
    autoplayNext,
    isTv,
    goToNextEpisode,
    notifySaveError,
  ]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!embedSyncSupported || !iframe) return;
    const intervalId = window.setInterval(() => {
      sendEmbedPlaybackCommand(iframe, "requestProgress");
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [embedSyncSupported]);

  const handleEmbedLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    sendEmbedPlaybackCommand(iframe, "handshake");
    sendEmbedPlaybackCommand(iframe, "requestProgress");
  };

  // === Direct stream (VidNest) effects ===
  const isDirect = selectedServerId === "direct";

  useEffect(() => {
    if (!isDirect) {
      setDirectStreams([]);
      setDirectPlaying(false);
      setActiveDirectStream(0);
      setDirectError(null);
      setDirectEnded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setDirectLoading(true);
      setDirectError(null);
      setDirectStreams([]);
      setDirectPlaying(false);
      setActiveDirectStream(0);
      triedDirectRef.current.clear();
      try {
        const tmdbId = movie.id.startsWith("tv-") ? movie.id.slice(3) : movie.id;
        const type = movie.id.startsWith("tv-") ? "tv" : "movie";
        const result = await resolveVidNestStreams({
          data: { id: tmdbId, type, season, episode },
        });
        if (cancelled) return;
        if (result.streams.length === 0) {
          setDirectError("No direct streams found for this title.");
        } else {
          setDirectStreams(result.streams);
        }
      } catch (e: any) {
        if (!cancelled) setDirectError(e?.message || "Failed to load streams.");
      } finally {
        if (!cancelled) setDirectLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDirect, movie.id, season, episode]);

  const playDirectStream = useCallback(
    (stream: VidNestStream, index: number) => {
      destroyHls();
      setActiveDirectStream(index);
      setDirectPlaying(true);
      setDirectEnded(false);
      setDirectBuffering(true);
      triedDirectRef.current.clear();

      const video = directVideoRef.current;
      if (!video) return;

      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      const proxyBase = siteUrl + "/api/proxy";

      if (stream.type === "hls") {
        const proxiedUrl = proxyBase + "?url=" + encodeURIComponent(stream.url) + (stream.referer ? "&referer=" + encodeURIComponent(stream.referer) : "");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = proxiedUrl;
        } else {
          import("hls.js").then(({ default: Hls }) => {
            if (hlsRef.current) hlsRef.current.destroy();
            if (!Hls.isSupported()) {
              video.src = proxiedUrl;
              return;
            }
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              startFragPrefetch: true,
              manifestLoadingTimeOut: 12000,
              manifestLoadingMaxRetry: 3,
              manifestLoadingRetryDelay: 1000,
              levelLoadingTimeOut: 12000,
              fragLoadingTimeOut: 12000,
            });
            hlsRef.current = hls;
            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setDirectBuffering(false);
              video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_: any, data: any) => {
              if (data.fatal) {
                console.log("[direct] HLS fatal error, trying next stream");
                destroyHls();
                tryNextDirect();
              }
            });
          });
        }
      } else {
        const src = stream.url;
        video.src = src;
      }

      let stallCount = 0;
      let lastTime = 0;
      const stallCheck = setInterval(() => {
        if (!video || video.ended) {
          clearInterval(stallCheck);
          return;
        }
        if (video.paused || video.seeking) {
          lastTime = video.currentTime;
          return;
        }
        if (video.currentTime === lastTime && video.currentTime > 0) {
          stallCount++;
          if (stallCount >= 3) {
            clearInterval(stallCheck);
            console.log("[direct] Stream stalled, trying next");
            tryNextDirect();
          }
        } else {
          stallCount = 0;
        }
        lastTime = video.currentTime;
      }, 5000);

      const errorHandler = () => {
        clearInterval(stallCheck);
        video.removeEventListener("error", errorHandler);
        console.log("[direct] Video error, trying next");
        tryNextDirect();
      };
      video.addEventListener("error", errorHandler);
    },
    [destroyHls, tryNextDirect],
  );

  const copyStreamUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast.success("URL copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy URL");
    });
  }, []);

  useEffect(() => {
    return () => {
      destroyHls();
      if (directHideTimer.current) window.clearTimeout(directHideTimer.current);
    };
  }, [destroyHls]);

  if (!movie) {
    return (
      <div className="grid min-h-dvh place-items-center gap-4 bg-black text-white">
        <p className="text-red-400">Movie not available</p>
        <Link to="/" className="text-sm text-white/60 hover:text-white underline">
          Go home
        </Link>
      </div>
    );
  }

  if (kidsMode && (isRatingBlockedForKids(movie.rating) || isGenreBlockedForKids(movie.genreIds ?? []))) {
    return (
      <div className="grid min-h-dvh place-items-center gap-4 bg-black px-4 text-center">
        <div className="grid size-24 place-items-center rounded-full bg-amber-500/15">
          <ShieldOff className="size-12 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Content not available for kids</h2>
          <p className="max-w-sm text-sm text-white/50">
            This title isn't suitable for kids profiles. Switch to a regular profile to watch it.
          </p>
        </div>
        <Link to="/browse" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-screen overflow-hidden bg-black select-none"
      onMouseMove={wake}
      onTouchEnd={onContainerTouch}
    >
      {videoUrl && !isDirect ? (
        isEmbedUrl(videoUrl) ? (
          <iframe
            ref={iframeRef}
            src={videoUrl}
            title={`Embed Player — ${movie.title}`}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={handleEmbedLoad}
            className="size-full border-0"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            poster={movie.backdrop}
            onPlay={() => setPlaying(true)}
            onPause={(e) => {
              setPlaying(false);
              doRecord(e.currentTarget.currentTime, e.currentTarget.duration || 0);
            }}
            onTimeUpdate={(e) => {
              const cur = e.currentTarget.currentTime;
              const dur = e.currentTarget.duration || 1;
              setProgress(dur > 0 ? (cur / dur) * 100 : 0);
              setDuration(dur);
              setCurrentTime(cur);
              if (Math.floor(cur) % 5 === 0) doRecord(cur, dur);
            }}
             onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              setDuration(dur);
              if (pendingSeekRef.current != null) {
                const t = pendingSeekRef.current;
                pendingSeekRef.current = null;
                e.currentTarget.currentTime = t;
              }
            }}
            onCanPlay={(e) => {
              setBuffering(false);
            }}
            onVolumeChange={(e) => {
              setVolume(e.currentTarget.volume);
              setMuted(e.currentTarget.muted);
            }}
            onEnded={handleVideoEnded}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            className="size-full object-contain"
          >
            {subtitles.map((sub) => (
              <track
                key={sub.lang}
                kind="subtitles"
                src={sub.url}
                srcLang={sub.lang}
                label={sub.label}
              />
            ))}
          </video>
        )
      ) : isDirect ? (
        directPlaying && directStreams[activeDirectStream] ? (
          <div
            ref={directContainerRef}
            className="relative size-full"
            onClick={() => {
              const v = directVideoRef.current;
              if (!v) return;
              if (v.paused) { v.play().catch(() => {}); setDirectPlayingState(true); }
              else { v.pause(); setDirectPlayingState(false); }
            }}
          >
            <video
              ref={directVideoRef}
              playsInline
              poster={movie.backdrop}
              onTimeUpdate={(e) => {
                const cur = e.currentTarget.currentTime;
                const dur = e.currentTarget.duration || 1;
                setDirectProgress(dur > 0 ? (cur / dur) * 100 : 0);
                setDirectDuration(dur);
                setDirectCurrentTime(cur);
                setDirectPlayingState(!e.currentTarget.paused);
              }}
              onLoadedMetadata={(e) => {
                setDirectDuration(e.currentTarget.duration);
                setDirectBuffering(false);
              }}
              onCanPlay={() => setDirectBuffering(false)}
              onWaiting={() => setDirectBuffering(true)}
              onPlaying={() => {
                setDirectBuffering(false);
                setDirectPlayingState(true);
              }}
              onPause={() => setDirectPlayingState(false)}
              onEnded={() => {
                setDirectEnded(true);
                if (autoplayNext && isTv && nextEp) goToNextEpisode();
              }}
              onVolumeChange={(e) => {
                setDirectVolume(e.currentTarget.volume);
                setDirectMuted(e.currentTarget.muted);
              }}
              className="size-full object-contain"
            />
            {directBuffering && (
              <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
                <Loader className="size-10 text-white/60 animate-spin" />
              </div>
            )}
            {/* Direct player controls */}
            <div
              className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent pt-8 pb-4 px-4 transition-opacity duration-300 ${directShowControls ? "opacity-100" : "opacity-0"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-sm text-white/90">
                <button
                  onClick={() => {
                    const v = directVideoRef.current;
                    if (!v) return;
                    if (v.paused) { v.play().catch(() => {}); setDirectPlayingState(true); }
                    else { v.pause(); setDirectPlayingState(false); }
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center"
                >
                  {directPlayingState ? (
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  ) : (
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={directProgress}
                  onChange={(e) => {
                    const v = directVideoRef.current;
                    if (!v || !v.duration) return;
                    v.currentTime = (Number(e.target.value) / 100) * v.duration;
                  }}
                  className="flex-1 h-1 accent-primary cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs tabular-nums text-white/70 min-w-[80px] text-right">
                  {fmt(directCurrentTime)} / {fmt(directDuration)}
                </span>
                <button
                  onClick={() => {
                    const v = directVideoRef.current;
                    if (v) v.muted = !v.muted;
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center"
                >
                  {directMuted ? (
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  )}
                </button>
                <button
                  onClick={goBack}
                  className="text-xs text-white/60 hover:text-white min-h-11 px-2"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center size-full bg-black p-4">
            {directLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="size-10 text-white/60 animate-spin" />
                <p className="text-sm text-white/50">Loading direct streams...</p>
              </div>
            ) : directError ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <Zap className="size-12 text-white/30" />
                <p className="text-sm text-white/50">{directError}</p>
                <p className="text-xs text-white/30">Try a different server above.</p>
              </div>
            ) : (
              <div className="w-full max-w-lg space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  {directStreams.length} direct stream{directStreams.length !== 1 ? "s" : ""} found
                </p>
                {directStreams.map((stream, i) => (
                  <div
                    key={`${stream.resolver}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white/90 truncate">
                          {stream.resolver}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          stream.type === "mp4" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                        }`}>
                          {stream.type.toUpperCase()}
                        </span>
                        {stream.language && (
                          <span className="text-[10px] text-white/40">{stream.language}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => playDirectStream(stream, i)}
                      className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                    >
                      <Play className="size-3" />
                      Play
                    </button>
                    <button
                      onClick={() => copyStreamUrl(stream.url)}
                      className="flex items-center gap-1 rounded bg-white/10 px-2 py-1.5 text-xs text-white/70 hover:bg-white/20 transition"
                    >
                      {copiedUrl === stream.url ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : null}

      {!showControls && (
        <button
          type="button"
          onClick={handleWakeTap}
          onTouchEnd={handleWakeTap}
          className="absolute inset-0 z-10 bg-transparent"
          aria-hidden="true"
        />
      )}

      {/* Top gradient overlay */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black via-black/60 to-transparent pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex flex-col gap-2 px-2 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="group/topbtn rounded-lg transition-colors duration-200 hover:bg-white/10 hover:backdrop-blur-sm -ml-1 sm:-ml-2 px-1 sm:px-2 py-2 sm:py-1">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1 sm:gap-2 text-white/90 hover:text-white min-h-10"
              >
                <ArrowLeft className="size-6 sm:size-6" />
                <span className="text-sm sm:text-base font-semibold drop-shadow-md">
                  {movie.title}
                  {season != null && episode != null && (
                    <span className="ml-2 text-sm font-normal text-white/60">
                      S{season} E{episode}
                    </span>
                  )}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  aria-label="Settings"
                  className="hover:text-white/70 transition min-h-11 min-w-11 flex items-center justify-center"
                >
                  <Settings className="size-6 sm:size-6" />
                </button>
                {showSettings && (
                  <div
                    className={`absolute top-full right-0 mt-2 ${isTv ? "w-80" : "w-56"} max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-3 text-sm shadow-2xl backdrop-blur-xl scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Server
                    </p>
                    <div className="grid grid-cols-2 gap-1 mb-3 max-h-40 overflow-y-auto">
                      {availableEmbedServers.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => handleServerSelect(server.id)}
                          className={`rounded px-3 py-1.5 text-xs text-left transition ${selectedServerId === server.id ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                        >
                          {server.name}
                        </button>
                      ))}
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Selected
                    </p>
                    <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                      {selectedServer.name}
                    </div>
                    {isTv && (
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
                            Autoplay next episode
                          </p>
                          <p className="text-[11px] text-white/50">
                            Automatically start the next episode when one ends.
                          </p>
                        </div>
                        <button
                          onClick={toggleAutoplayNext}
                          className={`rounded px-3 py-1.5 text-xs transition ${autoplayNext ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                        >
                          {autoplayNext ? "On" : "Off"}
                        </button>
                      </div>
                    )}
                    {isTv && movie.numberOfSeasons && movie.numberOfSeasons > 0 && (
                      <div className="mb-3">
                        <SeasonEpisodePicker
                          movieId={movie.id}
                          numberOfSeasons={movie.numberOfSeasons}
                          currentSeason={season}
                          currentEpisode={episode}
                        />
                      </div>
                    )}
                    {subtitles.length > 0 && (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                              Captions
                            </p>
                            <p className="text-[11px] text-white/50">
                              Toggle captions on or off without changing the selected subtitle
                              language.
                            </p>
                          </div>
                          <button
                            onClick={toggleCaptions}
                            className={`rounded px-3 py-1.5 text-xs transition ${captionsEnabled ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                          >
                            {captionsEnabled ? "On" : "Off"}
                          </button>
                        </div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                          Subtitles
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <button
                            onClick={() => handleSubtitleChange(null)}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeSubtitle === null ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                          >
                            Off
                          </button>
                          {subtitles.map((sub) => (
                            <button
                              key={sub.lang}
                              onClick={() => handleSubtitleChange(sub.lang)}
                              className={`rounded px-3 py-1.5 text-xs transition ${activeSubtitle === sub.lang ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center play/pause overlay removed */}

      {/* Rotate device hint */}
      {showRotateHint && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 gap-4 pointer-events-none">
          <RotateCw className="size-16 text-white/70 animate-[spin_2s_linear_infinite]" />
          <p className="text-sm text-white/70 text-center px-8">
            Rotate your device to landscape for a better viewing experience
          </p>
        </div>
      )}

      {/* Loading spinner */}
      {buffering && !ended && (
        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
          <Loader className="size-10 text-white/60 animate-spin" />
        </div>
      )}

      {/* Post-play overlay */}
      {(ended || (directEnded && isDirect && directPlaying)) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg text-white/70">You've finished watching</p>
            <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
            <div className="flex items-center gap-3">
              {isTv && nextEp && (
                <button
                  onClick={() => {
                    setEnded(false);
                    setDirectEnded(false);
                    goToNextEpisode();
                  }}
                  className="rounded bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  Next Episode
                </button>
              )}
              <button
                onClick={() => {
                  if (isDirect && directPlaying) {
                    const v = directVideoRef.current;
                    if (v) {
                      v.currentTime = 0;
                      v.play().catch(() => {});
                      setDirectPlayingState(true);
                      setDirectEnded(false);
                    }
                  } else {
                    const v = videoRef.current;
                    if (v) {
                      v.currentTime = 0;
                      v.play().catch(() => {});
                      setPlaying(true);
                      setEnded(false);
                    }
                  }
                }}
                className="rounded bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-white/90 transition"
              >
                Play Again
              </button>
              <button
                onClick={goBack}
                className="rounded bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                Back to Movie
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export const Route = createFileRoute("/_authenticated/watch/$id")({
  ssr: false,
  validateSearch: watchSearchSchema,
  loader: async ({ params }) => {
    let movie: any = null;
    try {
      movie = await movieById(params.id);
    } catch {}
    return { movie };
  },
  head: ({ loaderData }) => {
    const movie = loaderData?.movie;
    const title = `Watching ${movie?.title ?? "Video"} — StreamFlix`;
    const description = movie?.description
      ? `${movie.description.slice(0, 200)}`
      : "Watch movies and TV shows on StreamFlix.";
    const image = movie?.backdropSm || movie?.poster || "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...seoMetaFor(
          title,
          description,
          image,
          movie?.id?.startsWith("tv-") ? "video.tv_show" : "video.movie",
          "",
        ),
      ],
    };
  },
  component: PlayerPage,
  errorComponent: ({ error }) => (
    <div className="grid min-h-dvh place-items-center gap-4 bg-black p-8 text-white">
      <p className="text-red-400">Error: {(error as Error).message}</p>
      <p className="whitespace-pre font-mono text-xs text-white/40">
        {(error as Error).stack?.split("\n").slice(0, 3).join("\n")}
      </p>
      <Link to="/" className="text-sm text-white/60 hover:text-white underline">
        Go home
      </Link>
    </div>
  ),
});
