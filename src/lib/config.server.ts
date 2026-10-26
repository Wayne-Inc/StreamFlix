export function getServerConfig() {
  return {
    tmdbApiKey: process.env.TMDB_API_KEY,
    tmdbV3ApiKey: process.env.TMDB_V3_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    cronSecret: process.env.CRON_SECRET,
    siteUrl: process.env.VITE_SITE_URL,
  };
}

export type ServerConfig = ReturnType<typeof getServerConfig>;