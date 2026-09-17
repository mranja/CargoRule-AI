export interface TradeCountry {
  code: string;
  name: string;
  flag: string;
  region: string;
}

export interface TradeCarrier {
  id: string;
  name: string;
  type: 'Express' | 'Freight Ocean' | 'Freight Air' | 'Integrated';
}

export const MAJOR_COUNTRIES: TradeCountry[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia Pacific' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia Pacific' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'South Asia' },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'North America' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', region: 'Southeast Asia' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'East Asia' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'South America' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'North America' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', region: 'Europe' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', region: 'Southeast Asia' },
  { code: 'Global', name: 'Global / International', flag: '🌐', region: 'International' },
];

export const MAJOR_CARRIERS: TradeCarrier[] = [
  { id: 'DHL Express', name: 'DHL Express', type: 'Express' },
  { id: 'FedEx', name: 'FedEx', type: 'Express' },
  { id: 'UPS', name: 'UPS', type: 'Express' },
  { id: 'Maersk Line', name: 'Maersk Line', type: 'Freight Ocean' },
  { id: 'MSC', name: 'MSC (Mediterranean Shipping Company)', type: 'Freight Ocean' },
  { id: 'CMA CGM', name: 'CMA CGM', type: 'Freight Ocean' },
  { id: 'Hapag-Lloyd', name: 'Hapag-Lloyd', type: 'Freight Ocean' },
  { id: 'DB Schenker', name: 'DB Schenker', type: 'Integrated' },
  { id: 'Ocean Network Express (ONE)', name: 'Ocean Network Express (ONE)', type: 'Freight Ocean' },
  { id: 'Evergreen Marine', name: 'Evergreen Marine', type: 'Freight Ocean' },
  { id: 'COSCO Shipping', name: 'COSCO Shipping', type: 'Freight Ocean' },
  { id: 'Kuehne + Nagel', name: 'Kuehne + Nagel', type: 'Integrated' },
];

export const DOCUMENT_TYPES = [
  'Customs Regulation',
  'Shipping Policy',
  'Carrier Agreement',
  'Import Requirement',
  'Export Requirement',
  'Tariff Schedule',
  'Dangerous Goods Guide',
];

/**
 * Returns the flag emoji for a given country name or ISO code.
 */
export function getCountryFlag(country?: string | null): string {
  if (!country) return '🌐';
  const clean = country.trim().toLowerCase();
  if (clean === 'global' || clean === 'all' || clean === 'none' || clean === 'international') {
    return '🌐';
  }

  // Exact or contains match in MAJOR_COUNTRIES
  const found = MAJOR_COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === clean ||
      c.name.toLowerCase() === clean ||
      clean.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(clean)
  );

  if (found) return found.flag;

  // Common aliases and ISO codes
  const aliasFlags: Record<string, string> = {
    us: '🇺🇸',
    usa: '🇺🇸',
    'u.s.': '🇺🇸',
    'u.s.a.': '🇺🇸',
    uk: '🇬🇧',
    gb: '🇬🇧',
    gbr: '🇬🇧',
    de: '🇩🇪',
    deu: '🇩🇪',
    in: '🇮🇳',
    ind: '🇮🇳',
    br: '🇧🇷',
    bra: '🇧🇷',
    fr: '🇫🇷',
    fra: '🇫🇷',
    cn: '🇨🇳',
    chn: '🇨🇳',
    jp: '🇯🇵',
    jpn: '🇯🇵',
    ca: '🇨🇦',
    can: '🇨🇦',
    au: '🇦🇺',
    aus: '🇦🇺',
    sg: '🇸🇬',
    sgp: '🇸🇬',
    nl: '🇳🇱',
    nld: '🇳🇱',
    kr: '🇰🇷',
    mx: '🇲🇽',
    mex: '🇲🇽',
    ae: '🇦🇪',
    uae: '🇦🇪',
    it: '🇮🇹',
    ita: '🇮🇹',
    es: '🇪🇸',
    esp: '🇪🇸',
    ch: '🇨🇭',
    che: '🇨🇭',
    sa: '🇸🇦',
    vn: '🇻🇳',
    vnm: '🇻🇳',
    eu: '🇪🇺',
  };

  return aliasFlags[clean] || '🌐';
}

/**
 * Returns the clean display name for a given country name or code.
 */
export function getCountryDisplayName(country?: string | null): string {
  if (!country) return 'Global';
  const clean = country.trim().toLowerCase();
  if (clean === 'global' || clean === 'all' || clean === 'none' || clean === 'international') {
    return 'Global';
  }

  const found = MAJOR_COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === clean ||
      c.name.toLowerCase() === clean
  );

  if (found) return found.name;

  const aliasNames: Record<string, string> = {
    us: 'United States',
    usa: 'United States',
    uk: 'United Kingdom',
    gb: 'United Kingdom',
    de: 'Germany',
    in: 'India',
    br: 'Brazil',
    fr: 'France',
    cn: 'China',
    jp: 'Japan',
    ca: 'Canada',
    au: 'Australia',
    sg: 'Singapore',
    nl: 'Netherlands',
    kr: 'South Korea',
    mx: 'Mexico',
    ae: 'United Arab Emirates',
    uae: 'United Arab Emirates',
    it: 'Italy',
    es: 'Spain',
    ch: 'Switzerland',
    sa: 'Saudi Arabia',
    vn: 'Vietnam',
    eu: 'EU',
  };

  return aliasNames[clean] || country.trim();
}
