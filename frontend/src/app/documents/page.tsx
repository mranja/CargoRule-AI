import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentOverviewSection } from '@/components/dashboard/DocumentOverviewSection';

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Document Repository
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Browse and view all indexed logistics documents, customs guidelines, and carrier agreements.
          </p>
        </div>

        <DocumentOverviewSection />
      </div>
    </DashboardLayout>
  );
}
