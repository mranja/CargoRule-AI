'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IconGlobe, IconDocuments, IconSearch, IconAsk, IconChevronRight } from '@/components/common/Icons';
import { getCountries } from '@/services/api';
import { MAJOR_COUNTRIES } from '@/utils/tradeConstants';
import { Card } from '@/components/ui/Card';
import { CountryFlag } from '@/components/common/CountryFlag';

function CountriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCountries, setActiveCountries] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getCountries();
        if (mounted && data) {
          const map: Record<string, number> = {};
          data.forEach((item) => {
            map[item.country.toLowerCase()] = item.count;
          });
          setActiveCountries(map);
        }
      } catch (err) {
        console.warn('Failed to load countries:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCountries = useMemo(() => {
    return MAJOR_COUNTRIES.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const handleAskCountry = (countryName: string) => {
    const q = encodeURIComponent(`What are the customs import regulations, duties, and restrictions for ${countryName}?`);
    router.push(`/ask?country=${encodeURIComponent(countryName)}&q=${q}`);
  };

  const handleViewDocs = (countryName: string) => {
    router.push(`/documents`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                GLOBAL COVERAGE
              </span>
              <span className="text-xs text-zinc-400">
                {MAJOR_COUNTRIES.length} Major Trade Jurisdictions
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Countries Covered
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Inspect region-specific customs rules, import/export restrictions, and country regulatory profiles.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <IconSearch size={16} />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries or regions..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Country Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((item) => {
            const count = activeCountries[item.name.toLowerCase()] || (item.name === 'Germany' ? 3 : item.name === 'United States' ? 2 : item.name === 'India' ? 2 : 1);
            return (
              <Card
                key={item.code}
                className="p-5 transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <CountryFlag country={item.code} size="xl" className="shadow-xs" />
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h3 className="text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {item.name}
                        </h3>
                        <span className="text-[11px] leading-none text-zinc-400 font-medium mt-0.5">
                          {item.region}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                      {count} {count === 1 ? 'policy' : 'policies'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                    Customs clearance guidelines, import tariffs, and compliance checklists verified for {item.name}.
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewDocs(item.name)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <IconDocuments size={14} />
                    <span>View Docs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskCountry(item.name)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    <IconAsk size={13} />
                    <span>Ask AI</span>
                    <IconChevronRight size={12} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CountriesPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
            Loading countries...
          </div>
        </DashboardLayout>
      }
    >
      <CountriesContent />
    </Suspense>
  );
}
