'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DocumentManagementTable } from '@/components/documents/DocumentManagementTable';
import { getDocuments } from '@/services/api';
import { DocumentRecord } from '@/types';
import { IconUpload } from '@/components/common/Icons';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.warn('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initLoad() {
      try {
        const docs = await getDocuments();
        if (mounted) {
          setDocuments(docs);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load documents:', err);
        if (mounted) setIsLoading(false);
      }
    }
    initLoad();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Document Management"
          badge="ADMIN CONSOLE"
          description="Manage customs regulations, shipping policies, and carrier agreements used by CargoRule AI."
          action={
            <Button
              variant="primary"
              size="md"
              leftIcon={<IconUpload size={16} />}
              onClick={() => router.push('/admin/upload')}
            >
              Upload Document
            </Button>
          }
        />

        <DocumentManagementTable
          documents={documents}
          isLoading={isLoading}
          onRefresh={loadDocuments}
          onUploadClick={() => router.push('/admin/upload')}
        />
      </div>
    </DashboardLayout>
  );
}
