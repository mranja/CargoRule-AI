'use client';

import React, { useState } from 'react';
import { AskQueryFilters } from '@/types';
import { Select, SelectOption } from '../ui/Select';
import {
  IconFilter,
  IconSend,
  IconSparkles,
  IconSpinner,
  IconTrash,
} from '../common/Icons';

export interface ChatInputBarProps {
  question: string;
  onQuestionChange: (val: string) => void;
  filters: AskQueryFilters;
  onFiltersChange: (updated: Partial<AskQueryFilters>) => void;
  onSubmit: () => void;
  onClearThread?: () => void;
  isLoading?: boolean;
  hasMessages?: boolean;
}

const countryOptions: SelectOption[] = [
  { value: 'all', label: 'All Countries' },
  { value: 'Germany', label: 'Germany (DE)' },
  { value: 'India', label: 'India (IN)' },
  { value: 'United States', label: 'United States (US)' },
  { value: 'United Kingdom', label: 'United Kingdom (UK)' },
  { value: 'Singapore', label: 'Singapore (SG)' },
  { value: 'China', label: 'China (CN)' },
  { value: 'France', label: 'France (FR)' },
  { value: 'Australia', label: 'Australia (AU)' },
];

const carrierOptions: SelectOption[] = [
  { value: 'all', label: 'All Carriers' },
  { value: 'DHL Express', label: 'DHL Express' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'Maersk Line', label: 'Maersk Line' },
  { value: 'DB Schenker', label: 'DB Schenker' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Hapag-Lloyd', label: 'Hapag-Lloyd' },
];

const documentTypeOptions: SelectOption[] = [
  { value: 'all', label: 'All Document Types' },
  { value: 'Customs Regulation', label: 'Customs Regulation' },
  { value: 'Shipping Policy', label: 'Shipping Policy' },
  { value: 'Carrier Agreement', label: 'Carrier Agreement' },
  { value: 'Import Requirement', label: 'Import Requirement' },
  { value: 'Export Requirement', label: 'Export Requirement' },
];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  question,
  onQuestionChange,
  filters,
  onFiltersChange,
  onSubmit,
  onClearThread,
  isLoading = false,
  hasMessages = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const activeFilterCount =
    (filters.country && filters.country !== 'all' ? 1 : 0) +
    (filters.carrier && filters.carrier !== 'all' ? 1 : 0) +
    (filters.documentType && filters.documentType !== 'all' ? 1 : 0);

  return (
    <div className="space-y-3 sticky bottom-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4">
      {/* Collapsible Filter Drawer */}
      {showFilters && (
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1.5">
              <IconFilter size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Vector Retrieval Filters</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onFiltersChange({ country: 'all', carrier: 'all', documentType: 'all' })
              }
              className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              options={countryOptions}
              value={filters.country || 'all'}
              onChange={(e) => onFiltersChange({ country: e.target.value })}
              placeholder="Select Country"
              disabled={isLoading}
            />

            <Select
              options={carrierOptions}
              value={filters.carrier || 'all'}
              onChange={(e) => onFiltersChange({ carrier: e.target.value })}
              placeholder="Select Carrier"
              disabled={isLoading}
            />

            <Select
              options={documentTypeOptions}
              value={filters.documentType || 'all'}
              onChange={(e) => onFiltersChange({ documentType: e.target.value })}
              placeholder="Select Document Type"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Main Chat Input Bar Container */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
      >
        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
            showFilters || activeFilterCount > 0
              ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400'
              : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
          }`}
          title="Toggle vector retrieval filters"
        >
          <IconFilter size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Question Textarea */}
        <textarea
          rows={1}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask a question about customs, shipping, or carrier rules..."
          className="flex-1 resize-none bg-transparent px-2 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 max-h-32 min-h-[40px] leading-relaxed"
        />

        {/* Clear Thread Trigger */}
        {hasMessages && onClearThread && (
          <button
            type="button"
            onClick={onClearThread}
            disabled={isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Clear conversation history"
          >
            <IconTrash size={16} />
          </button>
        )}

        {/* Submit Arrow Button */}
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          aria-label="Send compliance query"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          {isLoading ? (
            <IconSpinner size={16} />
          ) : (
            <IconSend size={18} />
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
        <span>Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Enter</kbd> to send query</span>
        <span className="flex items-center gap-1">
          <IconSparkles size={12} className="text-blue-500" />
          RAG Vector Grounded
        </span>
      </div>
    </div>
  );
};
