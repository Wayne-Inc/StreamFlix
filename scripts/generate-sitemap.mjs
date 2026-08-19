import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://streamflix.dpdns.org";
const TMDB_BASE = "https://api.themoviedb.org/3";

const TMDB_API_KEY =
  process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || "";

if (!TMDB_API_KEY) {
  console.error("Missing TMDB API key. Set TMDB_API_KEY or VITE_TMDB_API_KEY env var.");
  process.exit(1);
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn(`TMDB ${res.status} for ${path}`);
    return { results: [] };
  }
  return res.json();
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchAllPages(path, maxPages = 5, params = {}) {
  const allResults = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await tmdbFetch(path, { ...params, page: String(page) });
    if (!data.results?.length) break;
    allResults.push(...data.results);
  }
  return allResults;
}

async function main() {
  console.log("Generating sitemap...\n");

  const urls = [];

  // Static pages
  urls.push({
    loc: `${SITE_URL}/`,
    changefreq: "daily",
    priority: "1.0",
  });
  urls.push({
    loc: `${SITE_URL}/download`,
    changefreq: "monthly",
    priority: "0.5",
  });
  urls.push({
    loc: `${SITE_URL}/privacy-policy`,
    changefreq: "yearly",
    priority: "0.3",
  });
  urls.push({
    loc: `${SITE_URL}/tos`,
    changefreq: "yearly",
    priority: "0.3",
  });

  // Genre/explore pages
  console.log("Fetching genres...");
  const genres = await tmdbFetch("/genre/movie/list");
  for (const genre of genres.genres || []) {
    urls.push({
      loc: `${SITE_URL}/explore/${genre.id}`,
      changefreq: "weekly",
      priority: "0.7",
    });
    console.log(`  Genre: ${genre.name} (${genre.id})`);
  }

  // Popular movies (5 pages = ~100)
  console.log("Fetching popular movies...");
  const popularMovies = await fetchAllPages("/movie/popular", 5);
  console.log(`  Got ${popularMovies.length} movies`);

  // Trending movies this week (5 pages = ~100)
  console.log("Fetching trending movies...");
  const trendingMovies = await fetchAllPages("/trending/movie/week", 5);
  console.log(`  Got ${trendingMovies.length} movies`);

  // Upcoming movies (2 pages = ~40)
  console.log("Fetching upcoming movies...");
  const upcomingMovies = await fetchAllPages("/movie/upcoming", 2);
  console.log(`  Got ${upcomingMovies.length} movies`);

  // Now playing movies (2 pages = ~40)
  console.log("Fetching now playing movies...");
  const nowPlayingMovies = await fetchAllPages("/movie/now_playing", 2);
  console.log(`  Got ${nowPlayingMovies.length} movies`);

  // Popular TV shows (5 pages = ~100)
  console.log("Fetching popular TV...");
  const popularTv = await fetchAllPages("/tv/popular", 5);
  console.log(`  Got ${popularTv.length} shows`);

  // Trending TV this week (5 pages = ~100)
  console.log("Fetching trending TV...");
  const trendingTv = await fetchAllPages("/trending/tv/week", 5);
  console.log(`  Got ${trendingTv.length} shows`);

  // Deduplicate movies/TV by ID
  const seenIds = new Set();

  function addTitle(item, type) {
    const tmdbId = item.id;
    const id = type === "tv" ? `tv-${tmdbId}` : String(tmdbId);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const dateField =
      type === "tv" ? item.first_air_date : item.release_date;

    urls.push({
      loc: `${SITE_URL}/movie/${id}`,
      lastmod: dateField || undefined,
      changefreq: "weekly",
      priority: item.popularity > 50 ? "0.9" : item.popularity > 20 ? "0.8" : "0.6",
    });
  }

  for (const m of popularMovies) addTitle(m, "movie");
  for (const m of trendingMovies) addTitle(m, "movie");
  for (const m of upcomingMovies) addTitle(m, "movie");
  for (const m of nowPlayingMovies) addTitle(m, "movie");
  for (const t of popularTv) addTitle(t, "tv");
  for (const t of trendingTv) addTitle(t, "tv");

  console.log(`\nTotal unique titles: ${seenIds.size}`);
  console.log(`Total URLs: ${urls.length}`);

  // Build XML
  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const u of urls) {
    xmlParts.push("  <url>");
    xmlParts.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    if (u.lastmod) {
      xmlParts.push(`    <lastmod>${u.lastmod}</lastmod>`);
    }
    xmlParts.push(`    <changefreq>${u.changefreq}</changefreq>`);
    xmlParts.push(`    <priority>${u.priority}</priority>`);
    xmlParts.push("  </url>");
  }

  xmlParts.push("</urlset>");

  const xml = xmlParts.join("\n");
  const outPath = join(__dirname, "..", "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`\nSitemap written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
