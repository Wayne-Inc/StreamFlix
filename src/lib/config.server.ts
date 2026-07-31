export function getServerConfig() {
  return {
    nodeEnv: import.meta.env.MODE,
    tmdbApiKey: import.meta.env.VITE_TMDB_API_KEY ?? import.meta.env.TMDB_API_KEY ?? "",
  };
}
