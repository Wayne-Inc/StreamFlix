-- Create the movie_videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('movie_videos', 'movie_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Grant access to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- RLS: anyone can read from movie_videos (public bucket)
CREATE POLICY "Anyone can read movie_videos" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'movie_videos');

-- RLS: authenticated users can upload/update/delete their own files in movie_videos
CREATE POLICY "Authenticated users can upload to movie_videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'movie_videos');

CREATE POLICY "Authenticated users can update movie_videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'movie_videos')
  WITH CHECK (bucket_id = 'movie_videos');

CREATE POLICY "Authenticated users can delete from movie_videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'movie_videos');
