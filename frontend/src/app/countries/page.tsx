'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { IconGlobe, IconDocuments } from '@/components/common/Icons';
import { getCountries } from '@/services/api';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Array<{ country: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getCountries();
        if (mounted) setCountries(data);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Countries Covered
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Inspect region-specific customs requirements, import/export restrictions, and country profiles.
          </p>
        </div>

        {countries.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <EmptyState
              title="No country data available"
              description="When logistics documents containing regional rules are ingested, country coverage cards will populate here."
              icon={<IconGlobe size={24} />}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <IconGlobe size={18} />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.country}
                    </span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {item.count} {item.count === 1 ? 'doc' : 'docs'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <IconDocuments size={14} />
                  <span>Customs & import guidelines indexed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
