import { getServerConfig } from "../config.server";

const TRAKT_BASE = "https://api.trakt.tv";

export async function traktFetch(path: string) {
  const { traktClientId } = getServerConfig();
  if (!traktClientId) return null;
  const res = await fetch(`${TRAKT_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "StreamFlix/1.0",
      "trakt-api-version": "2",
      "trakt-api-key": traktClientId,
    },
  });
  if (!res.ok) {
    if (res.status === 403) return null;
    throw new Error(`Trakt error ${res.status}`);
  }
  return res.json();
}
