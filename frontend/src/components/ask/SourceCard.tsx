import React from 'react';
import { SourceCitation } from '@/types';
import { Badge } from '../ui/Badge';
import { IconDocuments } from '../common/Icons';

export interface SourceCardProps {
  source: SourceCitation;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <IconDocuments size={16} />
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {source.documentTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {source.country && (
            <Badge variant="default" size="sm">
              {source.country}
            </Badge>
          )}
          {source.carrier && (
            <Badge variant="primary" size="sm">
              {source.carrier}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
        {source.section && <span>Section: {source.section}</span>}
        {source.pageNumber && (
          <>
            <span>•</span>
            <span>Page: {source.pageNumber}</span>
          </>
        )}
        {source.relevanceScore !== undefined && (
          <>
            <span>•</span>
            <span>Relevance: {Math.round(source.relevanceScore * 100)}%</span>
          </>
        )}
      </div>

      {source.snippet && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic border-l-2 border-blue-400 dark:border-blue-900 pl-2.5 py-0.5 leading-relaxed">
          &ldquo;{source.snippet}&rdquo;
        </p>
      )}
    </div>
  );
};
