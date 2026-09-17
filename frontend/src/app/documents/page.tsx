'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getDocuments } from '@/services/api';
import { DocumentRecord } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  IconDocuments,
  IconSearch,
  IconFilter,
  IconEye,
  IconAsk,
  IconGlobe,
  IconCarriers,
  IconUpload,
  IconClose,
} from '@/components/common/Icons';
import { DocumentDetailModal } from '@/components/documents/DocumentDetailModal';
import { useAuth } from '@/context/AuthContext';
import {
  MAJOR_COUNTRIES,
  MAJOR_CARRIERS,
  DOCUMENT_TYPES,
  getCountryDisplayName,
} from '@/utils/tradeConstants';
import { CountryFlag } from '@/components/common/CountryFlag';

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Filter states initialized from URL query params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedCarrier, setSelectedCarrier] = useState(searchParams.get('carrier') || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    const country = searchParams.get('country');
    if (country !== null) setSelectedCountry(country);
    const carrier = searchParams.get('carrier');
    if (carrier !== null) setSelectedCarrier(carrier);
  }, [searchParams]);

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

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title?.toLowerCase().includes(q);
        const matchesCountry = doc.country?.toLowerCase().includes(q);
        const matchesCarrier = doc.carrier?.toLowerCase().includes(q);
        const matchesType = doc.type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesCarrier && !matchesType) {
          return false;
        }
      }

      // Country filter
      if (selectedCountry !== 'all') {
        if (!doc.country || doc.country.toLowerCase() !== selectedCountry.toLowerCase()) {
          return false;
        }
      }

      // Carrier filter
      if (selectedCarrier !== 'all') {
        if (!doc.carrier || doc.carrier.toLowerCase() !== selectedCarrier.toLowerCase()) {
          return false;
        }
      }

      // Document type filter
      if (selectedType !== 'all') {
        if (!doc.type || doc.type.toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (doc.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [documents, searchQuery, selectedCountry, selectedCarrier, selectedType, selectedStatus]);

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedCountry !== 'all' ? 1 : 0) +
    (selectedCarrier !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedCarrier('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const handleAskAboutDoc = (doc: DocumentRecord) => {
    const q = encodeURIComponent(`What are the key rules and compliance requirements in "${doc.title}"?`);
    const c = encodeURIComponent(doc.country || 'all');
    const car = encodeURIComponent(doc.carrier || 'all');
    router.push(`/ask?q=${q}&country=${c}&carrier=${car}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                KNOWLEDGE BASE
              </span>
              <span className="text-xs text-zinc-400">
                {documents.length} {documents.length === 1 ? 'Total Document' : 'Total Documents'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Document Repository
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Browse, filter, and inspect all compliance guidelines, customs policies, and carrier service agreements.
            </p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin/upload')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <IconUpload size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <IconSearch size={16} />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title, policy, or keyword..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Major Country Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Countries ({MAJOR_COUNTRIES.length})</option>
                {MAJOR_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Major Carrier Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Carriers ({MAJOR_CARRIERS.length})</option>
                {MAJOR_CARRIERS.map((car) => (
                  <option key={car.id} value={car.name}>
                    {car.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type Filter */}
            <div className="w-full lg:w-44">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Types</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <IconClose size={14} />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </Card>

        {/* Documents Table View */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconDocuments size={18} className="text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                All Documents
              </h3>
            </div>
            <span className="text-xs text-zinc-400">
              Showing {filteredDocuments.length} of {documents.length}
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No documents match your filters"
                description="Try clearing search filters or selecting different countries and carriers to view indexed documents."
                icon={<IconFilter size={24} />}
                actionLabel={activeFiltersCount > 0 ? 'Clear Filters' : undefined}
                onAction={activeFiltersCount > 0 ? resetFilters : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] uppercase font-semibold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/70">
                  <tr>
                    <th className="w-[32%] min-w-[220px] px-4 py-3">Document Title</th>
                    <th className="w-[18%] min-w-[130px] px-4 py-3">Type</th>
                    <th className="w-[14%] min-w-[110px] px-4 py-3">Country / Region</th>
                    <th className="w-[12%] min-w-[95px] px-4 py-3">Carrier</th>
                    <th className="w-[8%] min-w-[70px] px-4 py-3">Chunks</th>
                    <th className="w-[10%] min-w-[85px] px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right min-w-[130px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs sm:max-w-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconDocuments size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate" title={doc.title}>{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                          <CountryFlag country={doc.country} size="sm" />
                          <span>{getCountryDisplayName(doc.country)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <IconCarriers size={13} className="text-zinc-400 shrink-0" />
                          {doc.carrier || 'All'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-500 whitespace-nowrap">
                        {doc.chunkCount || 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            doc.status === 'indexed' || doc.status === 'processed'
                              ? 'success'
                              : doc.status === 'processing'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                            title="Inspect document metadata & preview"
                          >
                            <IconEye size={14} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAskAboutDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Ask CargoRule AI about this document"
                          >
                            <IconAsk size={14} />
                            <span>Ask AI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Document Detail Preview Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </DashboardLayout>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
            Loading document repository...
          </div>
        </DashboardLayout>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
