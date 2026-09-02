'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { IconCarriers, IconDocuments } from '@/components/common/Icons';
import { getCarriers } from '@/services/api';

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Array<{ carrier: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getCarriers();
        if (mounted) setCarriers(data);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Carriers Covered
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            View carrier agreements, weight/size limits, and service policy restrictions.
          </p>
        </div>

        {carriers.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <EmptyState
              title="No carrier data available"
              description="Carrier profiles (DHL, FedEx, Maersk, etc.) will be indexed once carrier policy files are processed."
              icon={<IconCarriers size={24} />}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <IconCarriers size={18} />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.carrier}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {item.count} {item.count === 1 ? 'doc' : 'docs'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <IconDocuments size={14} />
                  <span>Service agreements & policies indexed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
