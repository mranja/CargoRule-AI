'use client';

import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { IconGlobe } from './Icons';

interface CountryFlagProps {
  country?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const NAME_TO_CODE_MAP: Record<string, string> = {
  brazil: 'BR',
  br: 'BR',
  india: 'IN',
  in: 'IN',
  china: 'CN',
  cn: 'CN',
  'united states': 'US',
  us: 'US',
  usa: 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  germany: 'DE',
  de: 'DE',
  deutschland: 'DE',
  france: 'FR',
  fr: 'FR',
  japan: 'JP',
  jp: 'JP',
  'united kingdom': 'GB',
  uk: 'GB',
  gb: 'GB',
  'great britain': 'GB',
  canada: 'CA',
  ca: 'CA',
  australia: 'AU',
  au: 'AU',
  singapore: 'SG',
  sg: 'SG',
  netherlands: 'NL',
  nl: 'NL',
  holland: 'NL',
  'south korea': 'KR',
  kr: 'KR',
  korea: 'KR',
  mexico: 'MX',
  mx: 'MX',
  'united arab emirates': 'AE',
  ae: 'AE',
  uae: 'AE',
  italy: 'IT',
  it: 'IT',
  spain: 'ES',
  es: 'ES',
  switzerland: 'CH',
  ch: 'CH',
  'saudi arabia': 'SA',
  sa: 'SA',
  vietnam: 'VN',
  vn: 'VN',
};

const sizeClasses = {
  xs: 'w-4 h-2.5',
  sm: 'w-5 h-3.5',
  md: 'w-6 h-4',
  lg: 'w-8 h-5.5',
  xl: 'w-10 h-7',
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  className = '',
  size = 'md',
}) => {
  if (!country || country.toLowerCase() === 'global' || country.toLowerCase() === 'all' || country.toLowerCase() === 'international') {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 ${sizeClasses[size]} ${className}`}>
        <IconGlobe size={size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : size === 'lg' ? 18 : 22} />
      </span>
    );
  }

  const lookupKey = country.trim().toLowerCase();
  const code = NAME_TO_CODE_MAP[lookupKey] || country.trim().toUpperCase();

  const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[code];

  if (!FlagComponent) {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 ${sizeClasses[size]} ${className}`}>
        <IconGlobe size={size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : size === 'lg' ? 18 : 22} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-black/10 dark:border-white/15 shadow-2xs ${sizeClasses[size]} ${className}`}
      title={country}
    >
      <FlagComponent className="w-full h-full object-cover" />
    </span>
  );
};
