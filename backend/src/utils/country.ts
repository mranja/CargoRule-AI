/**
 * Country Normalization and Standardization Utility
 *
 * Provides consistent representation of country names and ISO codes
 * across ingestion, vector storage, retrieval filtering, and citations.
 */

const COUNTRY_CANONICAL_MAP: Record<string, string> = {
  // Germany
  de: "Germany",
  deu: "Germany",
  germany: "Germany",
  deutschland: "Germany",

  // France
  fr: "France",
  fra: "France",
  france: "France",

  // United States
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "united states": "United States",
  "united states of america": "United States",

  // United Kingdom
  uk: "United Kingdom",
  gb: "United Kingdom",
  gbr: "United Kingdom",
  "great britain": "United Kingdom",
  "united kingdom": "United Kingdom",

  // India
  in: "India",
  ind: "India",
  india: "India",

  // Japan
  jp: "Japan",
  jpn: "Japan",
  japan: "Japan",

  // China
  cn: "China",
  chn: "China",
  china: "China",

  // Canada
  ca: "Canada",
  can: "Canada",
  canada: "Canada",

  // Australia
  au: "Australia",
  aus: "Australia",
  australia: "Australia",

  // Brazil
  br: "Brazil",
  bra: "Brazil",
  brazil: "Brazil",

  // Mexico
  mx: "Mexico",
  mex: "Mexico",
  mexico: "Mexico",

  // Singapore
  sg: "Singapore",
  sgp: "Singapore",
  singapore: "Singapore",

  // Netherlands
  nl: "Netherlands",
  nld: "Netherlands",
  netherlands: "Netherlands",
  holland: "Netherlands",

  // Italy
  it: "Italy",
  ita: "Italy",
  italy: "Italy",

  // Spain
  es: "Spain",
  esp: "Spain",
  spain: "Spain",

  // Switzerland
  ch: "Switzerland",
  che: "Switzerland",
  switzerland: "Switzerland",

  // UAE
  ae: "United Arab Emirates",
  are: "United Arab Emirates",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",

  // EU
  eu: "EU",
  "european union": "EU",
};

/**
 * Normalizes a country string to a canonical representation.
 * Returns undefined if country is missing, empty, or whitespace.
 *
 * @param country - Raw country string, ISO code, or alias
 * @returns Canonical country name or undefined if missing
 */
export function normalizeCountry(country?: string | null): string | undefined {
  if (country === null || country === undefined) {
    return undefined;
  }

  const trimmed = country.trim();
  if (!trimmed || trimmed.toLowerCase() === "all" || trimmed.toLowerCase() === "none") {
    return undefined;
  }

  const lookupKey = trimmed.toLowerCase();
  if (COUNTRY_CANONICAL_MAP[lookupKey]) {
    return COUNTRY_CANONICAL_MAP[lookupKey];
  }

  // If unrecognized, preserve and format in Title Case (e.g. "new zealand" -> "New Zealand")
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalizes a list of country filters into an array of canonical names.
 * Filters out empty/undefined values.
 *
 * @param countries - Array of country strings, or single string
 * @returns Array of canonical country names, or undefined if no valid countries
 */
export function normalizeCountryFilters(
  countries?: string | string[] | null
): string[] | undefined {
  if (!countries) {
    return undefined;
  }

  const list = Array.isArray(countries) ? countries : [countries];
  const normalizedSet = new Set<string>();

  for (const item of list) {
    const canonical = normalizeCountry(item);
    if (canonical) {
      normalizedSet.add(canonical);
    }
  }

  return normalizedSet.size > 0 ? Array.from(normalizedSet) : undefined;
}
