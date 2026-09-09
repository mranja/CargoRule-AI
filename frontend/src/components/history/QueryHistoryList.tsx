'use client';

import React from 'react';
import { QueryRecord } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { IconAsk, IconDocuments, IconHistory, IconTrash } from '../common/Icons';

export interface QueryHistoryListProps {
  queries: QueryRecord[];
  isLoading?: boolean;
  onSelectQuery: (query: QueryRecord) => void;
  onAskAgain: (query: QueryRecord) => void;
  onDeleteQuery: (query: QueryRecord) => void;
  onAskFirstQuestion?: () => void;
}

export const QueryHistoryList: React.FC<QueryHistoryListProps> = ({
  queries = [],
  isLoading = false,
  onSelectQuery,
  onAskAgain,
  onDeleteQuery,
  onAskFirstQuestion,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-1/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No query history found"
          description="Ask questions about customs regulations, shipping policies, or carrier agreements to build your query audit trail."
          icon={<IconHistory size={24} />}
          actionLabel="Ask Compliance Question"
          onAction={onAskFirstQuestion}
        />
      </Card>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3">
      {queries.map((q) => {
        const sourceCount = q.sources?.length || q.retrievedSources?.length || 0;
        const answerSnippet =
          q.answer && q.answer.length > 180
            ? `${q.answer.substring(0, 180)}...`
            : q.answer || 'No answer recorded.';

        return (
          <Card
            key={q.id}
            className="p-5 space-y-3 hover:border-blue-300 dark:hover:border-blue-900 transition-all shadow-2xs group"
          >
            {/* Header Row: Question Title & Metadata Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <IconAsk size={16} />
                </div>
                <h3
                  onClick={() => onSelectQuery(q)}
                  className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  {q.question}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {q.country && q.country !== '--' && (
                  <Badge variant="default" size="sm">
                    {q.country}
                  </Badge>
                )}
                {q.carrier && q.carrier !== '--' && (
                  <Badge variant="primary" size="sm">
                    {q.carrier}
                  </Badge>
                )}
                {sourceCount > 0 && (
                  <Badge variant="info" size="sm" className="flex items-center gap-1">
                    <IconDocuments size={12} />
                    <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
                  </Badge>
                )}
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatDate(q.createdAt || q.date)}
                </span>
              </div>
            </div>

            {/* Short Answer Preview */}
            <p
              onClick={() => onSelectQuery(q)}
              className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {answerSnippet}
            </p>

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <button
                type="button"
                onClick={() => onSelectQuery(q)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors"
              >
                Inspect Full Answer & Sources →
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<IconAsk size={14} />}
                  onClick={() => onAskAgain(q)}
                >
                  Ask Again
                </Button>

                <button
                  type="button"
                  onClick={() => onDeleteQuery(q)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete query record"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
