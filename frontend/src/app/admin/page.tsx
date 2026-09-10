'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  IconDocManage,
  IconUpload,
  IconDatabase,
  IconCheck,
  IconAlertCircle,
  IconSpinner,
  IconCarriers,
  IconGlobe,
  IconFileText,
  IconCpu,
} from '@/components/common/Icons';
import { getAdminStats } from '@/services/api';
import { AdminDashboardStats } from '@/types';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'carrier' | 'country' | 'type'>('carrier');

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);
    try {
      const data = await getAdminStats();
      if (data) {
        setStats(data);
      } else {
        setError('Unable to load admin statistics from backend.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const processing = stats?.processing;
  const vectorDb = stats?.vectorDatabase;
  const health = vectorDb?.vectorDbHealth;
  const consistency = vectorDb?.indexingConsistency;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              ADMIN CONSOLE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Admin & Pipeline Statistics
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live document processing metrics, vector database synchronization, and storage distributions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadStats(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <IconSpinner
                size={14}
                className={isRefreshing ? 'animate-spin text-blue-600' : 'text-zinc-400'}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
            </button>

            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <IconUpload size={14} />
              Upload Document
            </Link>

            <Link
              href="/admin/documents"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <IconDocManage size={14} />
              Manage Documents
            </Link>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        )}

        {/* Error Notification */}
        {error && !isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <IconAlertCircle size={18} className="shrink-0 text-red-500" />
            <div className="flex-1">
              <span className="font-semibold">Failed to fetch live statistics:</span> {error}
            </div>
            <button
              onClick={() => loadStats(true)}
              className="rounded-md bg-red-100 px-2.5 py-1 font-semibold text-red-800 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content when loaded */}
        {!isLoading && stats && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Documents */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Total Documents</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <IconFileText size={16} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {processing?.totalDocuments ?? 0}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">stored</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {processing?.processedDocuments ?? 0} indexed
                  </span>
                  {processing?.failedDocuments ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {processing.failedDocuments} failed
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Card 2: Success Rate */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Processing Success Rate</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <IconCheck size={16} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {processing?.successRate ?? 0}%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">rate</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, processing?.successRate ?? 0)}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Vectors Stored */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Vector Store Capacity</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <IconDatabase size={16} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {vectorDb?.totalVectorsStored ?? 0}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">vectors</span>
                </div>
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>
                    Avg <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{vectorDb?.averageVectorsPerDocument ?? 0}</strong> vectors / doc
                  </span>
                  <span className="mx-1">•</span>
                  <span>{vectorDb?.totalChunksGenerated ?? 0} chunks</span>
                </div>
              </div>

              {/* Card 4: Vector DB Health */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Vector DB Status</span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      health?.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : health?.status === 'degraded'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    <IconCpu size={16} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-xl font-bold capitalize ${
                      health?.status === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : health?.status === 'degraded'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {health?.status || 'Unknown'}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({health?.latencyMs ?? 0}ms latency)
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      consistency?.isConsistent ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {consistency?.isConsistent
                      ? '100% Vector Synchronized'
                      : `${consistency?.missingOrInconsistent ?? 0} Inconsistencies Detected`}
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Column Section: Document Processing vs Storage/Vector Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION 1: Document Processing Statistics */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Document Processing Metrics
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Status breakdown and ingestion efficiency across all uploaded policies.
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      Real-time
                    </span>
                  </div>

                  {/* Status Bar Indicators */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Processed & Indexed
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {processing?.processedDocuments} docs ({processing?.successRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${processing?.successRate ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Currently Processing
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {processing?.processingDocuments} docs
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{
                            width: `${
                              (processing?.totalDocuments ?? 0) > 0
                                ? ((processing?.processingDocuments ?? 0) /
                                    (processing?.totalDocuments ?? 1)) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Failed Ingestions
                        </span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {processing?.failedDocuments} docs ({processing?.failureRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${processing?.failureRate ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Processing Over Time */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                      Processing Activity Over Time
                    </h3>
                    {processing?.processingOverTime && processing.processingOverTime.length > 0 ? (
                      <div className="space-y-2">
                        {processing.processingOverTime.map((item) => (
                          <div
                            key={item.date}
                            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/60"
                          >
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                              {item.date}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Total: <strong className="text-zinc-800 dark:text-zinc-200">{item.total}</strong>
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                ✓ {item.processed}
                              </span>
                              {item.failed > 0 && (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                  ✗ {item.failed}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No activity timeline recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Processing Activity Table */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Recent Ingestion Activity
                    </h2>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Latest {processing?.recentActivity?.length ?? 0} jobs
                    </span>
                  </div>

                  {processing?.recentActivity && processing.recentActivity.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
                      {processing.recentActivity.map((activity) => (
                        <div key={activity.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {activity.title}
                              </p>
                              {activity.country && (
                                <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                  {activity.country}
                                </span>
                              )}
                              {activity.carrier && (
                                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                  {activity.carrier}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {activity.fileName || activity.id} • {new Date(activity.uploadedAt).toLocaleString()}
                            </p>
                            {activity.errorMessage && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                                Error: {activity.errorMessage}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {activity.chunkCount} chunks
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                                activity.status === 'indexed' || activity.status === 'processed'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : activity.status === 'processing'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No document processing records found.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Document Storage & Vector Database Statistics */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Vector Database & Storage Status
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Integrity verification between document store and vector embeddings.
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        consistency?.isConsistent
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {consistency?.isConsistent ? (
                        <>
                          <IconCheck size={12} />
                          Synchronized
                        </>
                      ) : (
                        <>
                          <IconAlertCircle size={12} />
                          Check Needed
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Stored Docs</span>
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {vectorDb?.totalDocumentsStored ?? 0}
                      </span>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Text Chunks</span>
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {vectorDb?.totalChunksGenerated ?? 0}
                      </span>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Embeddings</span>
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {vectorDb?.totalVectorsStored ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Consistency Audit Table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Document Synchronization Audit
                    </h3>
                    {consistency?.perDocument && consistency.perDocument.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                        {consistency.perDocument.map((doc) => (
                          <div
                            key={doc.documentId}
                            className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {doc.title}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {doc.chunkCount} chunks • {doc.vectorCount} vectors
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  doc.isConsistent
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                                }`}
                              >
                                {doc.isConsistent ? 'In Sync' : 'Mismatch'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No indexed documents to audit.</p>
                    )}
                  </div>
                </div>

                {/* Distributions: Carrier, Country, and Document Type */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Categorical Coverage & Density
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Document and chunk distribution across logistics dimensions.
                      </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                      <button
                        onClick={() => setActiveTab('carrier')}
                        className={`rounded-md px-2.5 py-1 transition-all ${
                          activeTab === 'carrier'
                            ? 'bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-900 dark:text-zinc-100'
                            : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Carriers
                      </button>
                      <button
                        onClick={() => setActiveTab('country')}
                        className={`rounded-md px-2.5 py-1 transition-all ${
                          activeTab === 'country'
                            ? 'bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-900 dark:text-zinc-100'
                            : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Countries
                      </button>
                      <button
                        onClick={() => setActiveTab('type')}
                        className={`rounded-md px-2.5 py-1 transition-all ${
                          activeTab === 'type'
                            ? 'bg-white text-zinc-900 shadow-xs font-semibold dark:bg-zinc-900 dark:text-zinc-100'
                            : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Doc Types
                      </button>
                    </div>
                  </div>

                  {/* Distribution List */}
                  <div className="space-y-2">
                    {activeTab === 'carrier' &&
                      vectorDb?.distributions.byCarrier.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <IconCarriers size={14} className="text-zinc-400" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                            <span>{item.documentCount} docs</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">
                              {item.chunkCount} chunks ({item.vectorCount} vectors)
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeTab === 'country' &&
                      vectorDb?.distributions.byCountry.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <IconGlobe size={14} className="text-zinc-400" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                            <span>{item.documentCount} docs</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">
                              {item.chunkCount} chunks ({item.vectorCount} vectors)
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeTab === 'type' &&
                      vectorDb?.distributions.byDocumentType.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <IconFileText size={14} className="text-zinc-400" />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                            <span>{item.documentCount} docs</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">
                              {item.chunkCount} chunks ({item.vectorCount} vectors)
                            </span>
                          </div>
                        </div>
                      ))}

                    {((activeTab === 'carrier' && vectorDb?.distributions.byCarrier.length === 0) ||
                      (activeTab === 'country' && vectorDb?.distributions.byCountry.length === 0) ||
                      (activeTab === 'type' && vectorDb?.distributions.byDocumentType.length === 0)) && (
                      <p className="text-xs text-zinc-400 italic py-4 text-center">
                        No distribution metrics available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
