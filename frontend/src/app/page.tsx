'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { QuickQuerySection } from '@/components/dashboard/QuickQuerySection';
import { RecentQueriesSection } from '@/components/dashboard/RecentQueriesSection';
import { DocumentOverviewSection } from '@/components/dashboard/DocumentOverviewSection';
import { CoverageSection } from '@/components/dashboard/CoverageSection';

export default function Home() {
  const router = useRouter();

  return (
    <DashboardLayout>
      {/* 1. Welcome Banner */}
      <WelcomeSection />

      {/* 2. KPI Cards */}
      <KpiCards />

      {/* 3. Quick Query Search Input & Prompt Chips */}
      <QuickQuerySection />

      {/* 4. Document Overview & Recent Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentQueriesSection
          onAskClick={() => router.push('/ask')}
        />
        <DocumentOverviewSection
          onUploadClick={() => router.push('/admin/upload')}
        />
      </div>

      {/* 5. Coverage Section (Countries & Carriers) */}
      <CoverageSection />
    </DashboardLayout>
  );
}
