'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CountryOption } from '@/types';
import { Badge } from '../ui/Badge';
import { IconClose, IconGlobe, IconSearch } from '../common/Icons';

export interface CountryFilterSelectProps {
  selectedCountry?: string;
  onCountryChange: (countryCode: string) => void;
  disabled?: boolean;
  className?: string;
}

export const COUNTRIES_LIST: CountryOption[] = [
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'IN', name: 'India', region: 'Asia-Pacific' },
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'UK', name: 'United Kingdom', region: 'Europe' },
  { code: 'SG', name: 'Singapore', region: 'Asia-Pacific' },
  { code: 'CN', name: 'China', region: 'Asia-Pacific' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'JP', name: 'Japan', region: 'Asia-Pacific' },
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East' },
  { code: 'KR', name: 'South Korea', region: 'Asia-Pacific' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
];

export const CountryFilterSelect: React.FC<CountryFilterSelectProps> = ({
  selectedCountry = 'all',
  onCountryChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCountry = COUNTRIES_LIST.find(
    (c) => c.code.toLowerCase() === selectedCountry.toLowerCase() || c.name.toLowerCase() === selectedCountry.toLowerCase()
  );

  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.region && c.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onCountryChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCountryChange('all');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
        Country Filter
      </label>

      {/* Trigger Button / Combobox Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900 cursor-pointer ${
          currentCountry
            ? 'border-blue-500 bg-blue-50/20 dark:border-blue-900'
            : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <IconGlobe size={16} className="text-zinc-400 shrink-0" />
          {currentCountry ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {currentCountry.name}
              </span>
              <Badge variant="primary" size="sm">
                {currentCountry.code}
              </Badge>
            </div>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">
              All Countries / Global
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {currentCountry && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear country filter"
            >
              <IconClose size={14} />
            </span>
          )}
          <span className="text-zinc-400 text-xs">▼</span>
        </div>
      </button>

      {/* Searchable Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-950/50">
            <IconSearch size={14} className="text-zinc-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country name or code..."
              className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <IconClose size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          <ul role="listbox" className="max-h-48 overflow-y-auto p-1 text-xs space-y-0.5">
            <li
              role="option"
              aria-selected={selectedCountry === 'all'}
              onClick={() => handleSelect('all')}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                selectedCountry === 'all'
                  ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <span>All Countries / Global</span>
              {selectedCountry === 'all' && <span className="text-blue-600">✓</span>}
            </li>

            {filteredCountries.map((c) => {
              const isSelected =
                selectedCountry.toLowerCase() === c.code.toLowerCase() ||
                selectedCountry.toLowerCase() === c.name.toLowerCase();

              return (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(c.code)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">({c.code})</span>
                  </div>
                  {c.region && (
                    <span className="text-[10px] text-zinc-400">{c.region}</span>
                  )}
                </li>
              );
            })}

            {filteredCountries.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-zinc-400">
                No matching countries found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
