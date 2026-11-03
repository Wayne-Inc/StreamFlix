import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const JUSTWATCH_API = "https://apis.justwatch.com/content/titles";
const JUSTWATCH_POPULAR = "https://apis.justwatch.com/content/popular";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface JustWatchProvider {
  id: number;
  name: string;
  logo: string;
  clearName: string;
  shortName: string;
  priority: number;
}

export interface JustWatchOffer {
  providerId: number;
  elementCount: number;
  url: string;
  presentationType: "rent" | "buy" | "subscribe" | "free" | "ads";
  retailPrice?: number;
  retailPriceCurrency?: string;
  quality?: string;
}

export interface JustWatchTitle {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  shortDescription: string;
  tmdbId?: number;
  imdbId?: string;
  objectType: "movie" | "show";
  poster: string;
  backdrop?: string;
  runtime?: number;
  genres: string[];
  ageCertification?: string;
  offers: JustWatchOffer[];
  score?: number;
  providerNames: string[];
}

export interface JustWatchSearchResult {
  items: JustWatchTitle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JustWatchPopularResult {
  items: JustWatchTitle[];
}

async function justwatchFetch<T>(
  url: string,
  params?: Record<string, string>,
): Promise<T> {
  const searchParams = new URLSearchParams({
    content_types: "movie,show",
    locale: "en_US",
    ...params,
  });
  const response = await fetch(`${url}?${searchParams}`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`JustWatch API error: ${response.status}`);
  }
  return response.json();
}

function mapPresentationType(pt: string): JustWatchOffer["presentationType"] {
  switch (pt) {
    case "rent":
    case "buy":
    case "subscribe":
    case "free":
    case "ads":
      return pt;
    default:
      return "subscribe";
  }
}

export const searchJustWatch = createServerFn({ method: "POST" })
  .validator(
    z.object({
      query: z.string().min(1),
      contentType: z.enum(["movie", "show", "all"]).optional().default("all"),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }),
  )
  .handler(async ({ data }) => {
    const results = await justwatchFetch<JustWatchSearchResult>(JUSTWATCH_API, {
      query: data.query,
      page: String(data.page),
      page_size: String(data.pageSize),
      ...(data.contentType !== "all" ? { content_types: data.contentType } : {}),
    });

    const mapped: JustWatchTitle[] = results.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      originalTitle: item.original_title || item.title,
      year: item.release_year || item.year || 0,
      shortDescription: item.short_description || "",
      tmdbId: item.tmdb_id || item.external_ids?.tmdb_id,
      imdbId: item.external_ids?.imdb_id,
      objectType: item.object_type || "movie",
      poster: item.poster ? `https://images.justwatch.com${item.poster}` : "",
      backdrop: item.backdrop ? `https://images.justwatch.com${item.backdrop}` : undefined,
      runtime: item.runtime,
      genres: item.genres?.map((g: any) => g.name) || [],
      ageCertification: item.age_certification,
      offers: (item.offers || []).map((o: any) => ({
        providerId: o.provider_id,
        elementCount: o.element_count || 0,
        url: o.standard_web_url || o.url || "",
        presentationType: mapPresentationType(o.presentation_type || "subscribe"),
        retailPrice: o.retail_price,
        retailPriceCurrency: o.retail_price_currency,
        quality: o.quality,
      })),
      score: item.scoring?.length ? item.scoring[0].value : undefined,
      providerNames: (item.offers || []).map((o: any) => o.provider_name || "").filter(Boolean),
    }));

    return {
      items: mapped,
      total: results.total,
      page: results.page,
      pageSize: results.pageSize,
    };
  });

export const getJustWatchTitle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number(),
    }),
  )
  .handler(async ({ data }) => {
    const result = await justwatchFetch<{ item: any }>(`${JUSTWATCH_API}/${data.id}`);
    const item = result.item;
    return {
      id: item.id,
      title: item.title,
      originalTitle: item.original_title || item.title,
      year: item.release_year || item.year || 0,
      shortDescription: item.short_description || "",
      tmdbId: item.tmdb_id || item.external_ids?.tmdb_id,
      imdbId: item.external_ids?.imdb_id,
      objectType: item.object_type || "movie",
      poster: item.poster ? `https://images.justwatch.com${item.poster}` : "",
      backdrop: item.backdrop ? `https://images.justwatch.com${item.backdrop}` : undefined,
      runtime: item.runtime,
      genres: item.genres?.map((g: any) => g.name) || [],
      ageCertification: item.age_certification,
      offers: (item.offers || []).map((o: any) => ({
        providerId: o.provider_id,
        elementCount: o.element_count || 0,
        url: o.standard_web_url || o.url || "",
        presentationType: mapPresentationType(o.presentation_type || "subscribe"),
        retailPrice: o.retail_price,
        retailPriceCurrency: o.retail_price_currency,
        quality: o.quality,
      })),
      score: item.scoring?.length ? item.scoring[0].value : undefined,
      providerNames: (item.offers || []).map((o: any) => o.provider_name || "").filter(Boolean),
    } as JustWatchTitle;
  });

export const getPopularJustWatch = createServerFn({ method: "POST" })
  .validator(
    z.object({
      contentType: z.enum(["movie", "show"]).optional().default("movie"),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(20),
    }),
  )
  .handler(async ({ data }) => {
    const results = await justwatchFetch<JustWatchPopularResult>(JUSTWATCH_POPULAR, {
      content_types: data.contentType,
      page: String(data.page),
      page_size: String(data.pageSize),
    });

    const mapped: JustWatchTitle[] = results.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      originalTitle: item.original_title || item.title,
      year: item.release_year || item.year || 0,
      shortDescription: item.short_description || "",
      tmdbId: item.tmdb_id || item.external_ids?.tmdb_id,
      imdbId: item.external_ids?.imdb_id,
      objectType: item.object_type || data.contentType,
      poster: item.poster ? `https://images.justwatch.com${item.poster}` : "",
      backdrop: item.backdrop ? `https://images.justwatch.com${item.backdrop}` : undefined,
      runtime: item.runtime,
      genres: item.genres?.map((g: any) => g.name) || [],
      ageCertification: item.age_certification,
      offers: (item.offers || []).map((o: any) => ({
        providerId: o.provider_id,
        elementCount: o.element_count || 0,
        url: o.standard_web_url || o.url || "",
        presentationType: mapPresentationType(o.presentation_type || "subscribe"),
        retailPrice: o.retail_price,
        retailPriceCurrency: o.retail_price_currency,
        quality: o.quality,
      })),
      score: item.scoring?.length ? item.scoring[0].value : undefined,
      providerNames: (item.offers || []).map((o: any) => o.provider_name || "").filter(Boolean),
    }));

    return { items: mapped };
  });

export const getProviders = createServerFn({ method: "POST" })
  .validator(z.object({}))
  .handler(async () => {
    const result = await justwatchFetch<{ providers: any[] }>(
      "https://apis.justwatch.com/content/providers",
      { locale: "en_US" },
    );
    return result.providers.map((p: any) => ({
      id: p.id,
      name: p.name,
      logo: p.logo ? `https://images.justwatch.com${p.logo}` : "",
      clearName: p.clear_name || p.name,
      shortName: p.short_name || p.name,
      priority: p.priority || 0,
    })) as JustWatchProvider[];
  });