import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { IconGlobe } from '@/components/common/Icons';

export default function CountriesPage() {
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState
            title="No country data available"
            description="When logistics documents containing regional rules are ingested, country coverage cards will populate here."
            icon={<IconGlobe size={24} />}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
