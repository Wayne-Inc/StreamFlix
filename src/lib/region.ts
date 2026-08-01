// Best-effort region detection from the browser's IANA timezone.
// Used to power the "Trending in your region" row without needing an API key.

const TIMEZONE_REGION: Record<string, string> = {
  "Africa/Abidjan": "CI",
  "Africa/Accra": "GH",
  "Africa/Algiers": "DZ",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Johannesburg": "ZA",
  "Africa/Kampala": "UG",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Tunis": "TN",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Caracas": "VE",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Halifax": "CA",
  "America/Lima": "PE",
  "America/Los_Angeles": "US",
  "America/Mexico_City": "MX",
  "America/New_York": "US",
  "America/Phoenix": "US",
  "America/Santiago": "CL",
  "America/Sao_Paulo": "BR",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Asia/Bangkok": "TH",
  "Asia/Dhaka": "BD",
  "Asia/Dubai": "AE",
  "Asia/Hong_Kong": "HK",
  "Asia/Istanbul": "TR",
  "Asia/Jakarta": "ID",
  "Asia/Jerusalem": "IL",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Asia/Riyadh": "SA",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Asia/Taipei": "TW",
  "Asia/Tokyo": "JP",
  "Asia/Yangon": "MM",
  "Australia/Adelaide": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Australia/Sydney": "AU",
  "Europe/Amsterdam": "NL",
  "Europe/Athens": "GR",
  "Europe/Berlin": "DE",
  "Europe/Brussels": "BE",
  "Europe/Bucharest": "RO",
  "Europe/Dublin": "IE",
  "Europe/Helsinki": "FI",
  "Europe/Lisbon": "PT",
  "Europe/London": "GB",
  "Europe/Madrid": "ES",
  "Europe/Moscow": "RU",
  "Europe/Oslo": "NO",
  "Europe/Paris": "FR",
  "Europe/Prague": "CZ",
  "Europe/Rome": "IT",
  "Europe/Stockholm": "SE",
  "Europe/Vienna": "AT",
  "Europe/Warsaw": "PL",
  "Europe/Zurich": "CH",
  "Pacific/Auckland": "NZ",
  "Pacific/Honolulu": "US",
};

const FALLBACK_REGION = "US";

export function detectRegion(): string {
  if (typeof window === "undefined") return FALLBACK_REGION;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_REGION[tz] ?? FALLBACK_REGION;
  } catch {
    return FALLBACK_REGION;
  }
}

export function regionLabel(code: string, countries: { iso: string; name: string }[]): string {
  const found = countries.find((c) => c.iso === code);
  return found?.name ?? code;
}
