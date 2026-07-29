export function getServerConfig() {
  return {
    nodeEnv: import.meta.env.MODE,
    tmdbApiKey: import.meta.env.VITE_TMDB_API_KEY ?? "",
    traktClientId: import.meta.env.VITE_TRAKT_CLIENT_ID ?? "",
    traktClientSecret: import.meta.env.VITE_TRAKT_CLIENT_SECRET ?? "",
  };
}
