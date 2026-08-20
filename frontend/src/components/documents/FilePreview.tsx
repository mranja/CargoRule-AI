import React from 'react';
import { Badge } from '../ui/Badge';
import { IconClose, IconDocuments } from '../common/Icons';

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  disabled = false,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExtensionBadge = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <IconDocuments size={20} />
        </div>

        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {file.name}
            </span>
            <Badge variant="primary" size="sm">
              {getExtensionBadge(file.name)}
            </Badge>
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove selected file ${file.name}`}
        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <IconClose size={18} />
      </button>
    </div>
  );
};
