'use client';

import React, { useState } from 'react';
import { AskQueryResponse } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { EmptyState } from '../ui/EmptyState';
import { SourceCard } from '../ask/SourceCard';
import {
  IconAsk,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconSpinner,
  IconThumbsDown,
  IconThumbsUp,
} from '../common/Icons';

export interface AnswerCardProps {
  response?: AskQueryResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  response,
  isLoading = false,
  isError = false,
  errorMessage,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    if (response?.answer) {
      navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Card className={`p-6 sm:p-7 space-y-5 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
            <IconAsk size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              CargoRule AI
            </h3>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
              <IconSpinner size={12} className="text-blue-600 dark:text-blue-400" />
              Searching vector database & generating answer...
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-3/4 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-5/6 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      </Card>
    );
  }

  // Error State
  if (isError) {
    return (
      <Card className={`p-6 sm:p-7 space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-2xs">
            <IconAsk size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              CargoRule AI
            </h3>
            <span className="text-[11px] text-rose-500 font-medium">
              Compliance Query Error
            </span>
          </div>
        </div>

        <Alert variant="danger" title="Failed to retrieve answer">
          {errorMessage || 'An unexpected error occurred while querying compliance regulations. Please try again.'}
        </Alert>
      </Card>
    );
  }

  // Empty State
  if (!response) {
    return (
      <Card className={`p-6 sm:p-7 ${className}`}>
        <EmptyState
          title="No compliance check performed yet"
          description="Type a question above to retrieve RAG-backed compliance answers, verified customs rules, and carrier agreement citations."
          icon={<IconSparkles size={24} />}
        />
      </Card>
    );
  }

  // Success Answer State
  return (
    <Card className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
            <IconAsk size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                CargoRule AI
              </h3>
              <Badge variant="primary" size="sm">
                AI-generated answer
              </Badge>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Verified against logistics compliance database
            </span>
          </div>
        </div>

        {response.timestamp && (
          <span className="text-[10px] text-zinc-400 font-mono">
            {response.timestamp}
          </span>
        )}
      </div>

      {/* Query Title if provided */}
      {response.question && (
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Query
          </span>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {response.question}
          </h4>
        </div>
      )}

      {/* Main Answer Content */}
      <div className="space-y-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:p-5 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap space-y-3">
          {response.answer}
        </div>
      </div>

      {/* Grounded Source Documents */}
      {response.sources && response.sources.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            <IconSparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Grounded Source Documents ({response.sources.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {response.sources.map((src) => (
              <SourceCard key={src.id} source={src} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Copy answer"
        >
          {copied ? (
            <>
              <IconCheck size={14} className="text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={14} />
              <span>Copy Answer</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-400 mr-1">Was this answer helpful?</span>
          <button
            type="button"
            onClick={() => setFeedback('up')}
            className={`rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
              feedback === 'up' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-400'
            }`}
            title="Helpful"
          >
            <IconThumbsUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => setFeedback('down')}
            className={`rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
              feedback === 'down' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-400'
            }`}
            title="Not helpful"
          >
            <IconThumbsDown size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
};
