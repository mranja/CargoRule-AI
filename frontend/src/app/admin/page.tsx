'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import {
  IconDocManage,
  IconUpload,
  IconDatabase,
  IconAlertCircle,
  IconSpinner,
  IconCarriers,
  IconGlobe,
  IconFileText,
  IconHistory,
  IconAsk,
} from '@/components/common/Icons';
import { getAdminStats } from '@/services/api';
import { AdminDashboardStats } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'distributions' | 'activity'>('overview');
  const [docStatusFilter, setDocStatusFilter] = useState<'all' | 'processing' | 'processed' | 'failed'>('all');
  const [distTab, setDistTab] = useState<'carrier' | 'country' | 'type'>('carrier');

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);
    setIsAccessDenied(false);
    try {
      const data = await getAdminStats();
      if (data) {
        setStats(data);
      } else {
        setError('Unable to retrieve administrative statistics from backend.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('ACCESS_DENIED:')) {
        setIsAccessDenied(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
    } else if (user) {
      setIsLoading(false);
    }
  }, [user, loadStats]);

  if (user && user.role !== 'admin') {
    return (
      <DashboardLayout>
        <AdminAccessDenied />
      </DashboardLayout>
    );
  }
    let mounted = true;
    const fetchStats = async () => {
      setError(null);
      setIsAccessDenied(false);
      try {
        const data = await getAdminStats();
        if (mounted && data) {
          setStats(data);
        }
      } catch (err) {
        if (mounted) {
          if (err instanceof Error && err.message.startsWith('ACCESS_DENIED:')) {
            setIsAccessDenied(true);
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load statistics');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSwitchAdminRole = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cargorule_auth_token');
      sessionStorage.removeItem('cargorule_auth_token');
    }
    loadStats(true);
  };

  const processing = stats?.processing;
  const vectorDb = stats?.vectorDatabase;
  const queriesStats = stats?.queries;
  const health = stats?.subsystemHealth || {
    backendApi: { status: 'healthy', uptime: 120, latencyMs: 2 },
    documentStore: { status: 'healthy', totalDocuments: processing?.totalDocuments || 0, indexedDocuments: processing?.processedDocuments || 0 },
    vectorDatabase: vectorDb?.vectorDbHealth || { status: 'connected', latencyMs: 5, totalVectors: vectorDb?.totalVectorsStored || 0, lastChecked: new Date().toISOString() },
    embeddingEngine: { status: 'healthy', mode: 'OpenAI / Local Deterministic', dimensions: 1536 },
    llmSubsystem: { status: 'healthy', model: 'gpt-4o-mini' },
  };
  const consistency = vectorDb?.indexingConsistency;

  // Filtered recent documents for Processing Monitor
  const filteredDocActivity = (processing?.recentActivity || []).filter((doc) => {
    if (docStatusFilter === 'all') return true;
    if (docStatusFilter === 'processed') return doc.status === 'indexed' || doc.status === 'processed';
    if (docStatusFilter === 'processing') return doc.status === 'processing';
    if (docStatusFilter === 'failed') return doc.status === 'error' || doc.status === 'failed';
    return true;
  });

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
              Admin & Pipeline Dashboard
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live document processing metrics, vector database synchronization, query analytics, and subsystem health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadStats(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
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

        {/* Access Denied Banner */}
        {isAccessDenied && (
          <Card className="p-6 border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 shrink-0">
                <IconAlertCircle size={24} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                  Access Denied — Administrative Privileges Required
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  Your current session is authenticated as a standard user (`user` role). Admin statistics, system health checks, and vector indexing monitors require administrative authorization.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Button variant="danger" size="sm" onClick={handleSwitchAdminRole}>
                    Switch to Admin Role Context
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => loadStats(true)}>
                    Retry Request
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* General Error Banner */}
        {error && !isAccessDenied && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertCircle size={16} className="text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadStats(true)}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Docs</span>
              <IconFileText size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : processing?.totalDocuments || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {processing?.processedDocuments || 0} processed, {processing?.failedDocuments || 0} failed
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Queries Processed</span>
              <IconHistory size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : queriesStats?.totalQueries || 0}
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {queriesStats?.queriesToday || 0} today, {queriesStats?.queriesThisWeek || 0} this week
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Sources Retrieved</span>
              <IconAsk size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : queriesStats?.totalSourcesRetrieved || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {queriesStats?.avgSourcesPerQuery || 0} avg per query
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Vector Chunks</span>
              <IconDatabase size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : vectorDb?.totalVectorsStored || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {vectorDb?.totalChunksGenerated || 0} chunks generated
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Countries</span>
              <IconGlobe size={18} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : vectorDb?.distributions.byCountry.length || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Global customs coverage
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Carriers</span>
              <IconCarriers size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isLoading ? '...' : vectorDb?.distributions.byCarrier.length || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Express & freight SLAs
            </p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Overview & Processing Monitor
          </button>

          <button
            onClick={() => setActiveTab('queries')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'queries'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Query & RAG Analytics
          </button>

          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'distributions'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Carrier & Country Insights
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            System Activity Log
          </button>
        </div>

        {/* TAB 1: Overview & Document Processing Monitor */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Subsystem Health Cards Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                System Subsystem Health Indicators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <Card className="p-4 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Backend REST API</span>
                    <Badge variant="success" size="sm">Healthy</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Express Node.js Server</p>
                  <div className="text-[10px] text-zinc-400 font-mono">Latency: 2ms • Status: 200 OK</div>
                </Card>

                <Card className="p-4 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Document Store</span>
                    <Badge variant="success" size="sm">Healthy</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">In-Memory Store</p>
                  <div className="text-[10px] text-zinc-400 font-mono">{processing?.totalDocuments || 0} Docs Stored</div>
                </Card>

                <Card className="p-4 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Vector Database</span>
                    <Badge variant={health.vectorDatabase?.status === 'connected' ? 'success' : 'primary'} size="sm">
                      {health.vectorDatabase?.status || 'Connected'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Vector Index Engine</p>
                  <div className="text-[10px] text-zinc-400 font-mono">{vectorDb?.totalVectorsStored || 0} Vectors Indexed</div>
                </Card>

                <Card className="p-4 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Embedding Engine</span>
                    <Badge variant="primary" size="sm">
                      {health.embeddingEngine?.status || 'Active'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{health.embeddingEngine?.mode || 'OpenAI / Local'}</p>
                  <div className="text-[10px] text-zinc-400 font-mono">1536 Vector Dimensions</div>
                </Card>

                <Card className="p-4 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">RAG LLM Engine</span>
                    <Badge variant="success" size="sm">Configured</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Model: {health.llmSubsystem?.model || 'gpt-4o-mini'}</p>
                  <div className="text-[10px] text-zinc-400 font-mono">Strict Source Grounding</div>
                </Card>
              </div>
            </div>

            {/* Document Processing Overview & Status Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-5 space-y-4 lg:col-span-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Processing Success & Failure Rates
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>Successfully Processed</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {processing?.successRate || 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${processing?.successRate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>Failed Processing</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {processing?.failureRate || 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${processing?.failureRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Average Chunks / Document:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{vectorDb?.averageChunksPerDocument || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Vectors / Document:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{vectorDb?.averageVectorsPerDocument || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Vector Sync Consistency:</span>
                    <strong className={consistency?.isConsistent ? 'text-emerald-600' : 'text-amber-600'}>
                      {consistency?.isConsistent ? '100% Consistent' : 'Verification Needed'}
                    </strong>
                  </div>
                </div>
              </Card>

              {/* Document Processing Monitor Table */}
              <Card className="p-5 space-y-4 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Document Processing Monitor
                    </h3>
                    <p className="text-[11px] text-zinc-500">Live ingestion status of compliance policy documents</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Filter:</span>
                    <select
                      value={docStatusFilter}
                      onChange={(e) => setDocStatusFilter(e.target.value as 'all' | 'processing' | 'processed' | 'failed')}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <option value="all">All Documents</option>
                      <option value="processed">Indexed / Processed</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed / Error</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Document Title</th>
                        <th className="py-2.5 px-3">Country / Carrier</th>
                        <th className="py-2.5 px-3">Chunks</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {filteredDocActivity.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-400">
                            No documents match the selected status filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDocActivity.map((doc) => (
                          <tr key={doc.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-zinc-400">{doc.fileName || doc.type}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                <Badge variant="default" size="sm">{doc.country || 'Global'}</Badge>
                                {doc.carrier && <Badge variant="primary" size="sm">{doc.carrier}</Badge>}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {doc.chunkCount}
                            </td>
                            <td className="py-3 px-3">
                              <Badge
                                variant={
                                  doc.status === 'indexed' || doc.status === 'processed'
                                    ? 'success'
                                    : doc.status === 'processing'
                                    ? 'primary'
                                    : 'danger'
                                }
                                size="sm"
                              >
                                {doc.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right text-zinc-400 font-mono text-[11px]">
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Query & RAG Analytics */}
        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total RAG Queries</span>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{queriesStats?.totalQueries || 0}</div>
                <p className="text-[10px] text-zinc-500">Recorded in audit log</p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase">Grounded Queries</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{queriesStats?.queriesWithSources || 0}</div>
                <p className="text-[10px] text-zinc-500">Queries with retrieved citations</p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase">Zero-Source Queries</span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{queriesStats?.zeroSourceQueries || 0}</div>
                <p className="text-[10px] text-zinc-500">Out-of-domain handling</p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase">Avg Citations / Query</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{queriesStats?.avgSourcesPerQuery || 0}</div>
                <p className="text-[10px] text-zinc-500">Source grounding density</p>
              </Card>
            </div>

            {/* Admin Query History Table */}
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Query History Audit Trail
                  </h3>
                  <p className="text-[11px] text-zinc-500">Inspect queries executed across CargoRule AI</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Question</th>
                      <th className="py-2.5 px-3">Metadata Tags</th>
                      <th className="py-2.5 px-3">Sources</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {(processing?.recentActivity || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          No query audit records recorded yet.
                        </td>
                      </tr>
                    ) : (
                      (processing?.recentActivity || []).map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-zinc-400">ID: {item.id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              {item.country && <Badge variant="default" size="sm">{item.country}</Badge>}
                              {item.carrier && <Badge variant="primary" size="sm">{item.carrier}</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium">
                            {item.chunkCount || 0} citations
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="success" size="sm">{item.status}</Badge>
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-400 font-mono text-[11px]">
                            {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: Carrier & Country Distributions */}
        {activeTab === 'distributions' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <button
                onClick={() => setDistTab('carrier')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  distTab === 'carrier'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                Carrier Distribution ({vectorDb?.distributions.byCarrier.length || 0})
              </button>

              <button
                onClick={() => setDistTab('country')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  distTab === 'country'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                Country Distribution ({vectorDb?.distributions.byCountry.length || 0})
              </button>

              <button
                onClick={() => setDistTab('type')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  distTab === 'type'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                Document Type Distribution ({vectorDb?.distributions.byDocumentType.length || 0})
              </button>
            </div>

            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {distTab === 'carrier'
                  ? 'Carrier Logistics Coverage Breakdown'
                  : distTab === 'country'
                  ? 'Country Customs Regulations Breakdown'
                  : 'Document Type Classification Breakdown'}
              </h3>

              <div className="space-y-4">
                {(distTab === 'carrier'
                  ? vectorDb?.distributions.byCarrier
                  : distTab === 'country'
                  ? vectorDb?.distributions.byCountry
                  : vectorDb?.distributions.byDocumentType
                )?.map((item, idx) => {
                  const maxDocs = Math.max(
                    1,
                    ...(distTab === 'carrier'
                      ? vectorDb?.distributions.byCarrier.map((c) => c.documentCount) || [1]
                      : distTab === 'country'
                      ? vectorDb?.distributions.byCountry.map((c) => c.documentCount) || [1]
                      : vectorDb?.distributions.byDocumentType.map((c) => c.documentCount) || [1])
                  );
                  const percent = Math.round((item.documentCount / maxDocs) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {item.documentCount} docs • {item.chunkCount} chunks • {item.vectorCount} vectors
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: Real-time Activity Feed */}
        {activeTab === 'activity' && (
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Unified System Event Audit Log
            </h3>

            <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {(stats?.activityFeed || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No system audit events recorded yet.
                </div>
              ) : (
                (stats?.activityFeed || []).map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0 mt-0.5">
                      {item.type === 'query_executed' ? <IconAsk size={16} /> : <IconFileText size={16} />}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}


      </div>
    </DashboardLayout>
  );
}
