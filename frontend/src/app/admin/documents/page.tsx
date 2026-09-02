'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentOverviewSection } from '@/components/dashboard/DocumentOverviewSection';
import { getDocuments } from '@/services/api';
import { DocumentRecord } from '@/types';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadDocs() {
      try {
        const docs = await getDocuments();
        if (mounted) setDocuments(docs);
      } catch (err) {
        console.warn('Failed to load documents:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadDocs();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-2">
            ADMIN FEATURE
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Document Management Console
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage vector DB document chunking, indexing status, and document metadata.
          </p>
        </div>

        <DocumentOverviewSection
          documents={documents}
          onUploadClick={() => router.push('/admin/upload')}
        />
      </div>
    </DashboardLayout>
  );
}
