'use client';

import React from 'react';
import { QueryRecord } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface DeleteHistoryDialogProps {
  query?: QueryRecord | null;
  isClearAll?: boolean;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteHistoryDialog: React.FC<DeleteHistoryDialogProps> = ({
  query,
  isClearAll = false,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!query && !isClearAll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-md p-6 space-y-4 shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          {isClearAll ? 'Clear Complete Query History?' : 'Delete Query Record?'}
        </h3>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {isClearAll ? (
            'Are you sure you want to clear all query history records? This action cannot be undone.'
          ) : (
            <>
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">&ldquo;{query?.question}&rdquo;</strong> from your audit history?
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            {isClearAll ? 'Clear History' : 'Delete Record'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
