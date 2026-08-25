import React from 'react';
import { AskQueryResponse } from '@/types';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { SourceCard } from './SourceCard';
import { IconSparkles } from '../common/Icons';

export interface AnswerDisplayProps {
  response: AskQueryResponse | null;
  isLoading?: boolean;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({
  response,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Searching Compliance Vectors...
          </h3>
        </div>

        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-full rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-5/6 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card className="p-6">
        <EmptyState
          title="No compliance check performed yet"
          description="Type a question above to retrieve RAG-backed compliance answers, verified customs rules, and carrier agreement citations."
          icon={<IconSparkles size={24} />}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-7 space-y-6">
      {/* Question Header Tag */}
      <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800 space-y-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Query
        </span>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {response.question}
        </h3>
      </div>

      {/* Answer Body Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <IconSparkles size={14} />
          </div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Generated Compliance Answer
          </h4>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200 leading-relaxed space-y-3">
          <p>{response.answer}</p>
        </div>
      </div>

      {/* Grounded Sources Section */}
      {response.sources && response.sources.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Grounded Document Sources ({response.sources.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {response.sources.map((src) => (
              <SourceCard key={src.id} source={src} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
