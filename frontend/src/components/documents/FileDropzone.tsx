'use client';

import React, { useState, useRef } from 'react';
import { IconUpload } from '../common/Icons';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  acceptedFormats = ['PDF', 'DOCX', 'TXT'],
  maxSizeMB = 25,
  disabled = false,
  error,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      onFileSelect(selectedFile);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload document drag and drop area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/40 scale-[0.99]'
            : error
            ? 'border-rose-400 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/30'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-blue-400 hover:bg-blue-50/20 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-blue-900'
        } ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 mb-3 shadow-2xs">
          <IconUpload size={24} />
        </div>

        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Drag and drop your files here
        </p>

        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">
          or click to browse
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="rounded-md bg-zinc-200/60 px-2 py-0.5 font-medium dark:bg-zinc-800">
            Supported: {acceptedFormats.join(', ')}
          </span>
          <span className="rounded-md bg-zinc-200/60 px-2 py-0.5 font-medium dark:bg-zinc-800">
            Max Size: {maxSizeMB}MB
          </span>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 px-1">
          {error}
        </p>
      )}
    </div>
  );
};
