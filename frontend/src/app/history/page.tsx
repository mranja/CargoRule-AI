'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RecentQueriesSection } from '@/components/dashboard/RecentQueriesSection';
import { getQueryHistory } from '@/services/api';
import { QueryRecord } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SourceCard } from '@/components/ask/SourceCard';
import { IconAsk, IconDocuments } from '@/components/common/Icons';

export default function HistoryPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      try {
        const data = await getQueryHistory();
        if (mounted) {
          setQueries(data);
          if (data.length > 0) {
            setSelectedQuery(data[0]);
          }
        }
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

  const handleAskAgain = (q: QueryRecord) => {
    const params = new URLSearchParams();
    params.set('q', q.question);
    if (q.carrier && q.carrier !== '--') params.set('carrier', q.carrier);
    if (q.country && q.country !== '--') params.set('country', q.country);
    router.push(`/ask?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Query History & Citations Audit
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Review previous compliance questions, retrieved sources, and audit logs.
          </p>
        </div>

        {/* Recent Queries Table */}
        <RecentQueriesSection
          queries={queries}
          selectedQueryId={selectedQuery?.id}
          onQueryClick={(q) => setSelectedQuery(q)}
          onAskClick={() => router.push('/ask')}
        />

        {/* Selected Query Detail & Sources Inspection */}
        {selectedQuery && (
          <Card className="p-6 space-y-5 border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Query Inspection
                  </span>
                  <Badge
                    variant={
                      selectedQuery.status === 'completed'
                        ? 'success'
                        : selectedQuery.status === 'processing'
                        ? 'primary'
                        : 'danger'
                    }
                  >
                    {selectedQuery.status}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedQuery.question}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconAsk size={14} />}
                  onClick={() => handleAskAgain(selectedQuery)}
                >
                  Ask Again
                </Button>
              </div>
            </div>

            {/* Metadata Badges & Timestamp */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Date: {selectedQuery.date}</span>
              {selectedQuery.createdAt && (
                <>
                  <span>•</span>
                  <span>Recorded: {new Date(selectedQuery.createdAt).toLocaleTimeString()}</span>
                </>
              )}
              {selectedQuery.country && (
                <>
                  <span>•</span>
                  <span>Country: <strong className="text-zinc-700 dark:text-zinc-200">{selectedQuery.country}</strong></span>
                </>
              )}
              {selectedQuery.carrier && (
                <>
                  <span>•</span>
                  <span>Carrier: <strong className="text-zinc-700 dark:text-zinc-200">{selectedQuery.carrier}</strong></span>
                </>
              )}
              {selectedQuery.model && (
                <>
                  <span>•</span>
                  <span>Model: {selectedQuery.model}</span>
                </>
              )}
            </div>

            {/* Answer Display */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Generated Answer
              </h4>
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedQuery.answer || 'No answer recorded for this query.'}
              </div>
            </div>

            {/* Retrieved Sources Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconDocuments size={16} className="text-blue-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Retrieved Sources ({selectedQuery.sources?.length || 0})
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Exact citations used to construct compliance answer
                </span>
              </div>

              {selectedQuery.sources && selectedQuery.sources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedQuery.sources.map((source, index) => (
                    <SourceCard key={source.id || `src-${index}`} source={source} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  No source citations recorded for this query.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
