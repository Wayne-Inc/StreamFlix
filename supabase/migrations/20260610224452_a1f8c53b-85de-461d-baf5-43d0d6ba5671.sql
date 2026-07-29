
-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Viewer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Viewer'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- WATCH PARTY ROOMS
CREATE TABLE public.watch_party_rooms (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  position_seconds NUMERIC NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_party_rooms TO authenticated;
GRANT ALL ON public.watch_party_rooms TO service_role;
ALTER TABLE public.watch_party_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user can read rooms"
  ON public.watch_party_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create rooms"
  ON public.watch_party_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Only host can update room"
  ON public.watch_party_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Only host can delete room"
  ON public.watch_party_rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);

CREATE TRIGGER watch_party_rooms_set_updated_at BEFORE UPDATE ON public.watch_party_rooms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- WATCH PARTY MESSAGES
CREATE TABLE public.watch_party_messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.watch_party_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  kind TEXT NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','reaction')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.watch_party_messages TO authenticated;
GRANT ALL ON public.watch_party_messages TO service_role;
ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user can read messages"
  ON public.watch_party_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can post their own messages"
  ON public.watch_party_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX watch_party_messages_room_created_idx
  ON public.watch_party_messages (room_id, created_at DESC);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_messages;
