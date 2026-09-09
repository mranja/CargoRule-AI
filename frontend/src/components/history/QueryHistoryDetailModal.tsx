'use client';

import React from 'react';
import { QueryRecord } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SourceCard } from '../ask/SourceCard';
import { IconAsk, IconClose, IconTrash } from '../common/Icons';

export interface QueryHistoryDetailModalProps {
  query: QueryRecord | null;
  onClose: () => void;
  onAskAgain: (query: QueryRecord) => void;
  onDeleteClick: (query: QueryRecord) => void;
}

export const QueryHistoryDetailModal: React.FC<QueryHistoryDetailModalProps> = ({
  query,
  onClose,
  onAskAgain,
  onDeleteClick,
}) => {
  if (!query) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-2xl p-6 sm:p-7 space-y-5 shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Compliance Query Record
              </span>
              <Badge
                variant={
                  query.status === 'completed'
                    ? 'success'
                    : query.status === 'processing'
                    ? 'primary'
                    : 'danger'
                }
                size="sm"
              >
                {query.status}
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
              {query.question}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Close detail"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Metadata Badges & Timestamp */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Recorded: <strong className="text-zinc-700 dark:text-zinc-200 font-mono">{formatDate(query.createdAt || query.date)}</strong></span>
          {query.country && (
            <>
              <span>•</span>
              <Badge variant="default" size="sm">
                Country: {query.country}
              </Badge>
            </>
          )}
          {query.carrier && (
            <>
              <span>•</span>
              <Badge variant="primary" size="sm">
                Carrier: {query.carrier}
              </Badge>
            </>
          )}
          {query.confidenceScore !== undefined && (
            <>
              <span>•</span>
              <Badge variant="success" size="sm">
                Confidence: {Math.round(query.confidenceScore * 100)}%
              </Badge>
            </>
          )}
        </div>

        {/* Generated Answer */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Generated Compliance Answer
          </h4>
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {query.answer || 'No answer generated for this query record.'}
          </div>
        </div>

        {/* Grounded Source Citations */}
        {query.sources && query.sources.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Grounded Source Citations ({query.sources.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {query.sources.map((src, idx) => (
                <SourceCard key={idx} source={src} />
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<IconTrash size={14} />}
            onClick={() => onDeleteClick(query)}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 w-full sm:w-auto"
          >
            Delete Record
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<IconAsk size={14} />}
              onClick={() => onAskAgain(query)}
            >
              Ask Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
