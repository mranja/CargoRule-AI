'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { QuickQuerySection } from '@/components/dashboard/QuickQuerySection';
import { RecentQueriesSection } from '@/components/dashboard/RecentQueriesSection';
import { DocumentOverviewSection } from '@/components/dashboard/DocumentOverviewSection';
import { CoverageSection } from '@/components/dashboard/CoverageSection';
import { getDashboardStats } from '@/services/api';
import { DocumentRecord, QueryRecord } from '@/types';

export default function Home() {
  const router = useRouter();
  const [statsData, setStatsData] = useState<{
    totalDocuments?: number;
    totalCountries?: number;
    totalCarriers?: number;
    totalQueries?: number;
    countries?: string[];
    carriers?: string[];
  }>({});
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [recentQueries, setRecentQueries] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        if (mounted && data) {
          const stats = data.stats || {};
          setStatsData({
            totalDocuments: stats.indexedDocuments ?? 0,
            totalCountries: stats.countriesCount ?? 0,
            totalCarriers: stats.carriersCount ?? 0,
            totalQueries: (data.recentQueries || []).length,
            countries: stats.countries || [],
            carriers: stats.carriers || [],
          });
          setRecentDocs(data.recentDocuments || []);
          setRecentQueries(data.recentQueries || []);
        }
      } catch (err) {
        console.warn('Could not load dashboard data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      {/* 1. Welcome Banner */}
      <WelcomeSection />

      {/* 2. KPI Cards */}
      <KpiCards
        totalDocuments={statsData.totalDocuments}
        totalCountries={statsData.totalCountries}
        totalCarriers={statsData.totalCarriers}
        totalQueries={statsData.totalQueries}
      />

      {/* 3. Quick Query Search Input & Prompt Chips */}
      <QuickQuerySection />

      {/* 4. Document Overview & Recent Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentQueriesSection
          queries={recentQueries}
          onAskClick={() => router.push('/ask')}
        />
        <DocumentOverviewSection
          documents={recentDocs}
          onUploadClick={() => router.push('/admin/upload')}
        />
      </div>

      {/* 5. Coverage Section (Countries & Carriers) */}
      <CoverageSection
        countries={statsData.countries}
        carriers={statsData.carriers}
      />
    </DashboardLayout>
  );
}
