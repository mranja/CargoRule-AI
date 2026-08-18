import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RecentQueriesSection } from '@/components/dashboard/RecentQueriesSection';

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Query History
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Review previous compliance questions, retrieved sources, and audit logs.
          </p>
        </div>

        <RecentQueriesSection />
      </div>
    </DashboardLayout>
  );
}
