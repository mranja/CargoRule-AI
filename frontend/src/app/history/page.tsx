'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RecentQueriesSection } from '@/components/dashboard/RecentQueriesSection';
import { getQueryHistory } from '@/services/api';
import { QueryRecord } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      try {
        const data = await getQueryHistory();
        if (mounted) setQueries(data);
      } catch (err) {
        console.warn('Failed to load query history:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

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

        <RecentQueriesSection
          queries={queries}
          onAskClick={() => router.push('/ask')}
        />
      </div>
    </DashboardLayout>
  );
}
