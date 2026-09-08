/**
 * Carrier Normalization and Standardization Utility
 *
 * Standardizes carrier names, brand variations, and service tiers
 * across ingestion, vector storage, retrieval filtering, and citations.
 */

const CARRIER_CANONICAL_MAP: Record<string, string> = {
  // DHL
  dhl: "DHL",
  "dhl express": "DHL",
  "dhl freight": "DHL",
  "dhl supply chain": "DHL",
  "dhl global forwarding": "DHL",

  // FedEx
  fedex: "FedEx",
  "fedex express": "FedEx",
  "fedex ground": "FedEx",
  "fedex freight": "FedEx",
  "federal express": "FedEx",

  // Maersk
  maersk: "Maersk",
  "maersk line": "Maersk",
  "a.p. moller - maersk": "Maersk",
  "ap moller maersk": "Maersk",
  "maersk logistics": "Maersk",

  // DB Schenker
  "db schenker": "DB Schenker",
  schenker: "DB Schenker",
  "db schenker logistics": "DB Schenker",

  // UPS
  ups: "UPS",
  "united parcel service": "UPS",
  "ups supply chain": "UPS",
  "ups express": "UPS",
  "ups freight": "UPS",

  // Hapag-Lloyd
  "hapag-lloyd": "Hapag-Lloyd",
  "hapag lloyd": "Hapag-Lloyd",
  hapag: "Hapag-Lloyd",

  // MSC
  msc: "MSC",
  "msc cargo": "MSC",
  "mediterranean shipping company": "MSC",

  // CMA CGM
  "cma cgm": "CMA CGM",
  "cma-cgm": "CMA CGM",

  // Kuehne+Nagel
  "kuehne+nagel": "Kuehne+Nagel",
  "kuehne + nagel": "Kuehne+Nagel",
  "kuehne nagel": "Kuehne+Nagel",
};

/**
 * Known canonical carrier names.
 */
export const KNOWN_CARRIERS = [
  "DHL",
  "FedEx",
  "Maersk",
  "DB Schenker",
  "UPS",
  "Hapag-Lloyd",
  "MSC",
  "CMA CGM",
  "Kuehne+Nagel",
] as const;

/**
 * Normalizes a carrier string to a canonical representation.
 * Returns undefined if carrier is missing, empty, or represents "all".
 *
 * @param carrier - Raw carrier name, brand variation, or acronym
 * @returns Canonical carrier name or undefined if missing / all
 */
export function normalizeCarrier(carrier?: string | null): string | undefined {
  if (carrier === null || carrier === undefined) {
    return undefined;
  }

  const trimmed = carrier.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "all" ||
    trimmed.toLowerCase() === "all carriers" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "any"
  ) {
    return undefined;
  }

  const lookupKey = trimmed.toLowerCase();
  if (CARRIER_CANONICAL_MAP[lookupKey]) {
    return CARRIER_CANONICAL_MAP[lookupKey];
  }

  // Preserve other custom carriers cleanly formatted in Title Case
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalizes an array of carrier filters or single carrier string into canonical names.
 *
 * @param carriers - Array of carrier strings or single string
 * @returns Array of canonical carrier names, or undefined if none
 */
export function normalizeCarrierFilters(
  carriers?: string | string[] | null
): string[] | undefined {
  if (!carriers) {
    return undefined;
  }

  const list = Array.isArray(carriers) ? carriers : [carriers];
  const normalizedSet = new Set<string>();

  for (const item of list) {
    const canonical = normalizeCarrier(item);
    if (canonical) {
      normalizedSet.add(canonical);
    }
  }

  return normalizedSet.size > 0 ? Array.from(normalizedSet) : undefined;
}
