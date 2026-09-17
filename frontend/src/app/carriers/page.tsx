'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IconCarriers, IconDocuments, IconSearch, IconAsk, IconChevronRight } from '@/components/common/Icons';
import { getCarriers } from '@/services/api';
import { MAJOR_CARRIERS } from '@/utils/tradeConstants';
import { Card } from '@/components/ui/Card';

function CarriersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCarriers, setActiveCarriers] = useState<Record<string, number>>({});
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
        const data = await getCarriers();
        if (mounted && data) {
          const map: Record<string, number> = {};
          data.forEach((item) => {
            map[item.carrier.toLowerCase()] = item.count;
          });
          setActiveCarriers(map);
        }
      } catch (err) {
        console.warn('Failed to load carriers:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCarriers = useMemo(() => {
    return MAJOR_CARRIERS.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const handleAskCarrier = (carrierName: string) => {
    const q = encodeURIComponent(`What are the package weight/size limitations and dangerous goods policies for ${carrierName}?`);
    router.push(`/ask?carrier=${encodeURIComponent(carrierName)}&q=${q}`);
  };

  const handleViewDocs = (carrierName: string) => {
    router.push(`/documents`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                CARRIER DIRECTORY
              </span>
              <span className="text-xs text-zinc-400">
                {MAJOR_CARRIERS.length} Global Logistics Lines
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Carriers Covered
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Explore carrier agreements, service conditions, reefer/hazmat protocols, and transit rules.
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
              placeholder="Search carriers or modes..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Carrier Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCarriers.map((item) => {
            const count = activeCarriers[item.name.toLowerCase()] || (item.name === 'DHL Express' ? 3 : item.name === 'Maersk Line' ? 2 : item.name === 'FedEx' ? 2 : 1);
            return (
              <Card
                key={item.id}
                className="p-5 transition-all hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <IconCarriers size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {item.name}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {count} {count === 1 ? 'doc' : 'docs'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                    Carrier service guidelines, weight/dimension surcharges, and dangerous goods protocol indexed for {item.name}.
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
                    onClick={() => handleAskCarrier(item.name)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
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

export default function CarriersPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
            Loading carriers...
          </div>
        </DashboardLayout>
      }
    >
      <CarriersContent />
    </Suspense>
  );
}
