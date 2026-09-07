import React from 'react';
import { SourceCitation } from '@/types';
import { Badge } from '../ui/Badge';
import { IconDocuments } from '../common/Icons';

export interface SourceCardProps {
  source: SourceCitation;
  className?: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, className = '' }) => {
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {/* Header Row: Document Title & Metadata Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <IconDocuments size={16} />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {source.documentTitle}
            </span>
            {source.documentId && (
              <span className="text-[10px] text-zinc-400 font-mono">
                ID: {source.documentId}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
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
          {source.documentType && (
            <Badge variant="info" size="sm">
              {source.documentType}
            </Badge>
          )}
          {source.relevanceScore !== undefined && (
            <Badge variant="success" size="sm">
              {Math.round(source.relevanceScore * 100)}% Match
            </Badge>
          )}
        </div>
      </div>

      {/* Metadata Detail Row: Section, Page, Version, Dates */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
        {source.section && <span>Section: {source.section}</span>}

        {source.pageNumber !== undefined && (
          <>
            {source.section && <span>•</span>}
            <span>Page {source.pageNumber}</span>
          </>
        )}

        {source.version && (
          <>
            {(source.section || source.pageNumber !== undefined) && <span>•</span>}
            <span>Version {source.version}</span>
          </>
        )}

        {source.effectiveDate && (
          <>
            <span>•</span>
            <span>Effective: {source.effectiveDate}</span>
          </>
        )}
      </div>

      {/* Snippet Quotation Text */}
      {source.snippet && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic border-l-2 border-blue-400 dark:border-blue-900 pl-2.5 py-0.5 leading-relaxed">
          &ldquo;{source.snippet}&rdquo;
        </p>
      )}
    </div>
  );
};
