import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { IconCarriers } from '@/components/common/Icons';

export default function CarriersPage() {
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState
            title="No carrier data available"
            description="Carrier profiles (DHL, FedEx, Maersk, etc.) will be indexed once carrier policy files are processed."
            icon={<IconCarriers size={24} />}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
