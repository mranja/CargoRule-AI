import React from 'react';
import { SourceCitation } from '@/types';
import { SourceCard } from './SourceCard';
import { IconSparkles } from '../common/Icons';

export interface SourceListProps {
  sources?: SourceCitation[];
  title?: string;
  className?: string;
}

export const SourceList: React.FC<SourceListProps> = ({
  sources = [],
  title = 'Grounded Source Documents',
  className = '',
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
        <IconSparkles size={14} className="text-blue-600 dark:text-blue-400" />
        <span>
          {title} ({sources.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
};
