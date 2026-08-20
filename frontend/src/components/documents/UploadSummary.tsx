import React from 'react';
import { UploadMetadata } from '@/types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export interface UploadSummaryProps {
  file: File | null;
  metadata: UploadMetadata;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({
  file,
  metadata,
}) => {
  if (!file) return null;

  return (
    <Card className="p-4 sm:p-5 bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Upload Submission Summary
        </h4>
        <Badge variant="primary" size="sm">
          Ready for Indexing
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">File Name</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
            {file.name}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Document Type</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.documentType || 'Unspecified'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Country</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.country || 'Global'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Carrier</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.carrier || 'All'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Version</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.version || '1.0'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Effective Date</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.effectiveDate || 'Immediate'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 font-medium block">Expiry Date</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
            {metadata.expiryDate || 'No Expiry'}
          </span>
        </div>
      </div>
    </Card>
  );
};
