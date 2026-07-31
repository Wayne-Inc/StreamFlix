export const DOWNLOAD_SERVERS: { name: string; movie: string; tv: string }[] = [
  {
    name: "VidKing",
    movie: "https://www.vidking.net/embed/movie/{id}?color=e50914&autoPlay=true",
    tv: "https://www.vidking.net/embed/tv/{id}/{season}/{episode}?color=e50914&autoPlay=true&nextEpisode=true",
  },
  {
    name: "VSEmbed",
    movie: "https://vsembed.su/embed/movie/{id}",
    tv: "https://vsembed.su/embed/tv/{id}/{season}/{episode}",
  },
  {
    name: "AutoEmbed",
    movie: "https://player.autoembed.cc/embed/movie/{id}",
    tv: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}",
  },
  {
    name: "2Embed",
    movie: "https://www.2embed.cc/embed/{id}",
    tv: "https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}",
  },
  {
    name: "MultiEmbed",
    movie: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tv: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
  },
  {
    name: "VidEasy",
    movie: "https://player.videasy.net/movie/{id}",
    tv: "https://player.videasy.net/tv/{id}/{season}/{episode}",
  },
  {
    name: "SmashyStream",
    movie: "https://embed.smashystream.com/playere.php?tmdb={id}",
    tv: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}",
  },
  {
    name: "P-Stream",
    movie: "https://iframe.pstream.org/embed/tmdb-movie-{id}",
    tv: "https://iframe.pstream.org/embed/tmdb-tv-{id}/{season}/{episode}",
  },
  {
    name: "VidSrc CC",
    movie: "https://vidsrc.cc/v2/embed/movie/{id}",
    tv: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}",
  },
  {
    name: "Embed.su",
    movie: "https://embed.su/embed/movie/{id}",
    tv: "https://embed.su/embed/tv/{id}/{season}/{episode}",
  },
  {
    name: "VidSrc.to",
    movie: "https://vidsrc.to/embed/movie/{id}",
    tv: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
  },
];

export function buildEmbedUrl(
  id: string,
  name: string,
  season?: number,
  episode?: number,
): string | null {
  const server = DOWNLOAD_SERVERS.find((s) => s.name === name);
  if (!server) return null;
  const isTv = id.startsWith("tv-");
  const realId = isTv ? id.slice(3) : id;
  let url = isTv ? server.tv : server.movie;
  url = url.replace("{id}", realId);
  if (season != null) url = url.replace("{season}", String(season));
  if (episode != null) url = url.replace("{episode}", String(episode));
  return url;
}
