'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectOption } from '@/components/ui/Select';
import { QueryHistorySearch } from '@/components/history/QueryHistorySearch';
import { QueryHistoryList } from '@/components/history/QueryHistoryList';
import { QueryHistoryDetailModal } from '@/components/history/QueryHistoryDetailModal';
import { DeleteHistoryDialog } from '@/components/history/DeleteHistoryDialog';
import { getQueryHistory, deleteQueryRecord, clearQueryHistory } from '@/services/api';
import { QueryRecord } from '@/types';
import { IconAsk, IconTrash } from '@/components/common/Icons';

const countryOptions: SelectOption[] = [
  { value: 'all', label: 'All Countries' },
  { value: 'Germany', label: 'Germany (DE)' },
  { value: 'India', label: 'India (IN)' },
  { value: 'United States', label: 'United States (US)' },
  { value: 'United Kingdom', label: 'United Kingdom (UK)' },
  { value: 'Singapore', label: 'Singapore (SG)' },
  { value: 'China', label: 'China (CN)' },
  { value: 'France', label: 'France (FR)' },
  { value: 'Australia', label: 'Australia (AU)' },
];

const carrierOptions: SelectOption[] = [
  { value: 'all', label: 'All Carriers' },
  { value: 'DHL Express', label: 'DHL Express' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'Maersk Line', label: 'Maersk Line' },
  { value: 'DB Schenker', label: 'DB Schenker' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Hapag-Lloyd', label: 'Hapag-Lloyd' },
];

export default function HistoryPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null);
  const [deletingQuery, setDeletingQuery] = useState<QueryRecord | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getQueryHistory({
        search,
        country: countryFilter,
        carrier: carrierFilter,
      });
      setQueries(data);
    } catch (err) {
      console.warn('Failed to load query history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, countryFilter, carrierFilter]);

  useEffect(() => {
    let mounted = true;
    async function initLoad() {
      try {
        const data = await getQueryHistory({
          search,
          country: countryFilter,
          carrier: carrierFilter,
        });
        if (mounted) {
          setQueries(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load query history:', err);
        if (mounted) setIsLoading(false);
      }
    }
    initLoad();
    return () => {
      mounted = false;
    };
  }, [search, countryFilter, carrierFilter]);

  const handleAskAgain = (q: QueryRecord) => {
    const params = new URLSearchParams();
    params.set('q', q.question);
    if (q.carrier && q.carrier !== 'all') params.set('carrier', q.carrier);
    if (q.country && q.country !== 'all') params.set('country', q.country);
    router.push(`/ask?${params.toString()}`);
  };

  const handleConfirmDeleteQuery = async () => {
    if (!deletingQuery) return;
    setIsDeleting(true);
    try {
      await deleteQueryRecord(deletingQuery.id);
      setDeletingQuery(null);
      if (selectedQuery?.id === deletingQuery.id) {
        setSelectedQuery(null);
      }
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete query record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearQueryHistory();
      setIsClearAllModalOpen(false);
      setSelectedQuery(null);
      fetchHistory();
    } catch (err) {
      console.error('Failed to clear query history:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCountryFilter('all');
    setCarrierFilter('all');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Query History"
          badge="AUDIT LOGS"
          description="Review previous customs regulations and compliance queries, view grounded source citations, or re-run queries."
          action={
            <div className="flex items-center gap-2">
              {queries.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconTrash size={14} />}
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  Clear History
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                leftIcon={<IconAsk size={16} />}
                onClick={() => router.push('/ask')}
              >
                Ask New Question
              </Button>
            </div>
          }
        />

        {/* Search & Filter Toolbar */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <QueryHistorySearch
                value={search}
                onChange={setSearch}
                onClear={() => setSearch('')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              <Select
                label="Country Tag"
                options={countryOptions}
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                disabled={isLoading}
              />
              <Select
                label="Carrier SLA"
                options={carrierOptions}
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {(search || countryFilter !== 'all' || carrierFilter !== 'all') && (
              <Button
                variant="outline"
                size="md"
                onClick={handleResetFilters}
                className="w-full lg:w-auto shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Query History List Container */}
        <QueryHistoryList
          queries={queries}
          isLoading={isLoading}
          onSelectQuery={(q) => setSelectedQuery(q)}
          onAskAgain={handleAskAgain}
          onDeleteQuery={(q) => setDeletingQuery(q)}
          onAskFirstQuestion={() => router.push('/ask')}
        />

        {/* Selected Query Inspection Modal */}
        <QueryHistoryDetailModal
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
          onAskAgain={handleAskAgain}
          onDeleteClick={(q) => setDeletingQuery(q)}
        />

        {/* Delete Single Record Confirmation Modal */}
        <DeleteHistoryDialog
          query={deletingQuery}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDeleteQuery}
          onCancel={() => setDeletingQuery(null)}
        />

        {/* Clear All Confirmation Modal */}
        {isClearAllModalOpen && (
          <DeleteHistoryDialog
            isClearAll={true}
            isDeleting={isDeleting}
            onConfirm={handleConfirmClearAll}
            onCancel={() => setIsClearAllModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
