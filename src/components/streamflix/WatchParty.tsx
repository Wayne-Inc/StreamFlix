import { useEffect, useRef, useState } from "react";
import { Send, Copy, X, Users, Smile, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

type Room = {
  id: string;
  code: string;
  host_id: string;
  movie_id: string;
  position_seconds: number;
  is_playing: boolean;
  main_duration?: number;
  video_url?: string;
  season?: number;
  episode?: number;
  updated_at: Timestamp | ReturnType<typeof serverTimestamp> | null;
};

type Message = {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_photo_url?: string;
  content: string;
  kind: "chat" | "reaction";
  created_at: Timestamp | null;
};

const REACTIONS = ["❤️", "🔥", "😂", "😱", "👏", "💀"];

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function pushRoomStateToPlayer(
  updated: Room,
  userId: string | null,
  onRoomStateUpdate?: (state: WatchPartyRoomState) => void,
) {
  const uid = userId ?? auth.currentUser?.uid ?? null;
  if (!onRoomStateUpdate || (uid && updated.host_id === uid)) return;
  onRoomStateUpdate({
    position_seconds: Number(updated.position_seconds),
    is_playing: updated.is_playing,
    main_duration: updated.main_duration,
    host_id: updated.host_id,
    video_url: updated.video_url,
    season: updated.season,
    episode: updated.episode,
    updated_at: updated.updated_at instanceof Timestamp ? updated.updated_at.toMillis() : null,
  });
}

type WatchPartyRoomState = {
  position_seconds: number;
  is_playing: boolean;
  main_duration?: number;
  host_id: string;
  video_url?: string;
  season?: number;
  episode?: number;
  updated_at?: number | null;
};

type Props = {
  movieId: string;
  open: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  defaultCode?: string;
  mainVideoUrl: string;
  season?: number;
  episode?: number;
  onRoomStateUpdate?: (state: WatchPartyRoomState) => void;
};

export function WatchPartyPanel(props: Props) {
  const { movieId, open, onClose, videoRef, defaultCode, mainVideoUrl, season, episode, onRoomStateUpdate } = props;
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Viewer");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomUpdated, setRoomUpdated] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [floats, setFloats] = useState<{ id: number; emoji: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomIdRef = useRef<string | null>(null);
  const hostRoomRef = useRef<Room | null>(null);
  roomIdRef.current = room?.id ?? null;
  hostRoomRef.current = room;

  // load auth user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setUserId(user.uid);
    setUserPhoto(user.photoURL);
    const profileRef = doc(db, "profiles", user.uid);
    getDoc(profileRef).then((snap) => {
      const data = snap.data();
      if (data?.display_name) setUserName(data.display_name);
      if (data?.avatar_url) setUserPhoto(data.avatar_url);
    });
  }, []);

  // auto-join via defaultCode
  useEffect(() => {
    if (!open || !userId || !defaultCode || room) return;
    setJoinCode(defaultCode);
    // small delay to let component settle
    const t = setTimeout(() => {
      const code = defaultCode;
      if (!code) return;
      setBusy(true);
      const q = query(collection(db, "watch_party_rooms"), where("code", "==", code), limit(1));
      getDocs(q).then((snap) => {
        if (snap.empty) { toast.error("Room not found"); setBusy(false); return; }
        const d = snap.docs[0];
        const data = d.data();
        if (data.movie_id !== movieId) { toast.error("Wrong movie for this party"); setBusy(false); return; }
        setRoom({ id: d.id, ...data } as Room);
        pushRoomStateToPlayer({ id: d.id, ...data } as Room, userId, onRoomStateUpdate);
        toast.success(`Joined ${code}`);
        setBusy(false);
      }).catch(() => { setBusy(false); toast.error("Failed to join"); });
    }, 500);
    return () => clearTimeout(t);
  }, [open, userId, defaultCode]);

  // cleanup room + messages when host leaves the page
  const roomRef = useRef(room);
  roomRef.current = room;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  useEffect(() => {
    return () => {
      const r = roomRef.current;
      const uid = userIdRef.current;
      if (!r || !uid || r.host_id !== uid) return;
      getDocs(query(collection(db, "watch_party_messages"), where("room_id", "==", r.id))).then((snap) => {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "watch_party_rooms", r.id));
        batch.commit().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  // subscribe to messages for current room
  useEffect(() => {
    if (!room) return;
    const messagesQuery = query(
      collection(db, "watch_party_messages"),
      where("room_id", "==", room.id),
      orderBy("created_at", "asc"),
      limit(200),
    );
    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      msgs.forEach((m) => {
        if (m.kind === "reaction" && m.user_id !== userId) {
          const id = Date.now() + Math.random();
          setFloats((f) => [...f, { id, emoji: m.content }]);
          setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 2400);
        }
      });
    });

    // subscribe to room updates
    const roomRef = doc(db, "watch_party_rooms", room.id);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) return;
      const updated = { id: snap.id, ...snap.data() } as Room;
      setRoom(updated);
      pushRoomStateToPlayer(updated, userId, onRoomStateUpdate);
    });

    return () => {
      unsubMessages();
      unsubRoom();
    };
  }, [room?.id, userId, onRoomStateUpdate]);

  // host: broadcast playback state periodically
  useEffect(() => {
    const roomId = roomIdRef.current;
    const hostRoom = hostRoomRef.current;
    if (!roomId || !userId || !hostRoom || hostRoom.host_id !== userId) return;
    const v = videoRef.current;
    if (!v) return;
    const firestoreRoomRef = doc(db, "watch_party_rooms", roomId);
    const tick = async () => {
      const currentRoom = hostRoomRef.current;
      if (!currentRoom) return;
      const updateData: Partial<Room> = {
        position_seconds: v.currentTime,
        is_playing: !v.paused,
        updated_at: serverTimestamp(),
      };
      if (mainVideoUrl) updateData.video_url = mainVideoUrl;
      if (season != null) updateData.season = season;
      else if (currentRoom.season != null) updateData.season = currentRoom.season;
      if (episode != null) updateData.episode = episode;
      else if (currentRoom.episode != null) updateData.episode = currentRoom.episode;
      try {
        await updateDoc(firestoreRoomRef, updateData);
      } catch {
        /* ignore transient write failures */
      }
    };
    void tick();
    const interval = window.setInterval(tick, 500);
    const onPlayPauseOrSeek = () => void tick();
    const onTimeUpdate = () => {
      if (!v.paused) void tick();
    };
    v.addEventListener("play", onPlayPauseOrSeek);
    v.addEventListener("pause", onPlayPauseOrSeek);
    v.addEventListener("seeked", onPlayPauseOrSeek);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      window.clearInterval(interval);
      v.removeEventListener("play", onPlayPauseOrSeek);
      v.removeEventListener("pause", onPlayPauseOrSeek);
      v.removeEventListener("seeked", onPlayPauseOrSeek);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [room?.id, userId, videoRef, mainVideoUrl, season, episode]);

  // host: broadcast immediately when playback state changes
  useEffect(() => {
    const roomId = roomIdRef.current;
    const hostRoom = hostRoomRef.current;
    if (!roomId || !userId || !hostRoom || hostRoom.host_id !== userId) return;
    const v = videoRef.current;
    if (!v) return;
    const firestoreRoomRef = doc(db, "watch_party_rooms", roomId);
    void updateDoc(firestoreRoomRef, {
      position_seconds: v.currentTime,
      is_playing: !v.paused,
      updated_at: serverTimestamp(),
    }).catch(() => {});
  }, [room?.id, userId, videoRef]);

  // autoscroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const createRoom = async () => {
    if (!userId) return toast.error("Please sign in to host a watch party.");
    setBusy(true);
    try {
      const code = randomCode();
      const docRef = await addDoc(collection(db, "watch_party_rooms"), {
        code,
        host_id: userId,
        movie_id: movieId,
        position_seconds: 0,
        is_playing: false,
        ...(mainVideoUrl ? { video_url: mainVideoUrl } : {}),
        ...(season != null ? { season } : {}),
        ...(episode != null ? { episode } : {}),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      const snap = await getDoc(docRef);
      setRoom({ id: docRef.id, ...snap.data() } as Room);
      toast.success(`Room created: ${code}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    try {
      const q = query(collection(db, "watch_party_rooms"), where("code", "==", code), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Room not found");
        setBusy(false);
        return;
      }
      const d = snap.docs[0];
      const data = d.data();
      const joined = { id: d.id, ...data } as Room;
      setRoom(joined);
      pushRoomStateToPlayer(joined, userId, onRoomStateUpdate);
      toast.success(`Joined ${code}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  const leave = async () => {
    if (room && userId && room.host_id === userId) {
      try {
        const msgQ = query(collection(db, "watch_party_messages"), where("room_id", "==", room.id));
        const msgSnap = await getDocs(msgQ);
        const batch = writeBatch(db);
        msgSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "watch_party_rooms", room.id));
        await batch.commit();
      } catch { /* best effort */ }
    }
    setRoom(null);
    setMessages([]);
  };

  const send = async (content: string, kind: "chat" | "reaction" = "chat") => {
    if (!room || !userId || !content.trim()) return;
    try {
      await addDoc(collection(db, "watch_party_messages"), {
        room_id: room.id,
        user_id: userId,
        user_name: userName,
        user_photo_url: userPhoto,
        content: content.slice(0, 500),
        kind,
        created_at: serverTimestamp(),
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    send(draft, "chat");
    setDraft("");
  };

  if (!open) return null;

  return (
    <>
      {/* Floating reactions over the video */}
      <div className="pointer-events-none fixed inset-y-0 right-1/3 z-30 overflow-hidden">
        {floats.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-10 text-4xl"
            style={{
              left: `${20 + ((f.id * 37) % 60)}%`,
              animation: "floatUp 2.4s ease-out forwards",
            }}
          >
            {f.emoji}
          </span>
        ))}
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(-60vh) scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>

      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-border bg-background/95 backdrop-blur-xl shadow-2xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h3 className="font-semibold">Watch Party</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </header>

        {!room ? (
          <div className="flex-1 space-y-6 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Watch with friends — synced playback, live chat, reactions.</p>
            </div>
            <button
              onClick={createRoom}
              disabled={busy || !userId}
              className="w-full rounded bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Host a new party
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR JOIN <div className="h-px flex-1 bg-border" />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); joinRoom(); }}
              className="space-y-2"
            >
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={8}
                className="w-full rounded bg-surface px-4 py-3 text-center text-lg font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                disabled={busy || !joinCode}
                className="w-full rounded border border-border py-3 font-semibold hover:border-foreground disabled:opacity-60"
              >
                Join party
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Code</span>
                <code className="rounded bg-surface px-2 py-1 font-mono font-bold tracking-widest">{room.code}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(room.code); toast.success("Code copied"); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Copy code"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <button onClick={leave} className="text-xs text-muted-foreground hover:text-destructive">Leave</button>
            </div>

            <div className="border-b border-border p-2">
              <div className="flex justify-around">
                {REACTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => send(e, "reaction")}
                    className="rounded-full p-2 text-2xl transition-transform hover:scale-125"
                    aria-label={`React ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div ref={scrollRef} className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="mx-auto size-8 opacity-50" />
                    <p className="mt-2">Say hi to start the chat</p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  {m.kind === "reaction" ? (
                    <p className="text-muted-foreground">
                      {m.user_photo_url ? (
                        <img src={m.user_photo_url} alt="" className="mr-1 inline size-4 rounded-full" />
                      ) : (
                        <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-[8px] font-bold text-white">
                          {m.user_name[0]?.toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-foreground">{m.user_name}</span> reacted {m.content}
                    </p>
                  ) : (
                    <div className={`flex items-start gap-2 ${m.user_id === userId ? "flex-row-reverse" : ""}`}>
                      {m.user_photo_url ? (
                        <img src={m.user_photo_url} alt="" className="mt-0.5 size-6 shrink-0 rounded-full" />
                      ) : (
                        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-[10px] font-bold text-white">
                          {m.user_name[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className={m.user_id === userId ? "text-right" : ""}>
                        <p className="text-xs text-muted-foreground">{m.user_name}</p>
                        <p className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${m.user_id === userId ? "bg-primary text-primary-foreground" : "bg-surface"}`}>
                          {m.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={onSubmitChat} className="flex gap-2 border-t border-border p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                placeholder="Send a message…"
                className="flex-1 rounded-full bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" aria-label="Send" className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="size-4" />
              </button>
            </form>
          </>
        )}
      </aside>
    </>
  );
}

export function WatchPartyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-foreground/15 px-3 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-foreground/25"
    >
      <Smile className="size-4" /> Watch Party
    </button>
  );
}
