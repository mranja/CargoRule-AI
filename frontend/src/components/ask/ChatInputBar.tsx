'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AskQueryFilters } from '@/types';
import { MAJOR_COUNTRIES, MAJOR_CARRIERS, DOCUMENT_TYPES } from '@/utils/tradeConstants';
import {
  IconFilter,
  IconSend,
  IconSparkles,
  IconSpinner,
  IconTrash,
  IconGlobe,
  IconCarriers,
  IconClose,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea like ChatGPT / Claude
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

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
    <div className="w-full max-w-4xl mx-auto space-y-1.5">
      {/* Floating Filter Popover / Drawer */}
      {showFilters && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <IconFilter size={14} />
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Vector Retrieval Scope
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({ country: 'all', carrier: 'all', documentType: 'all' })
                  }
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  Reset Scope
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <IconClose size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Country Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <IconGlobe size={12} />
                Country
              </label>
              <select
                value={filters.country || 'all'}
                onChange={(e) => onFiltersChange({ country: e.target.value })}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Countries ({MAJOR_COUNTRIES.length})</option>
                {MAJOR_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Carrier Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <IconCarriers size={12} />
                Carrier
              </label>
              <select
                value={filters.carrier || 'all'}
                onChange={(e) => onFiltersChange({ carrier: e.target.value })}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Carriers ({MAJOR_CARRIERS.length})</option>
                {MAJOR_CARRIERS.map((car) => (
                  <option key={car.id} value={car.name}>
                    {car.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Document Type
              </label>
              <select
                value={filters.documentType || 'all'}
                onChange={(e) => onFiltersChange({ documentType: e.target.value })}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="all">All Document Types</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ChatGPT / Claude Style Floating Prompt Box */}
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-3 shadow-lg transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Active Filter Pills inside Input */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-2">
            {filters.country && filters.country !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                <IconGlobe size={11} />
                {filters.country}
                <button
                  type="button"
                  onClick={() => onFiltersChange({ country: 'all' })}
                  className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.carrier && filters.carrier !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                <IconCarriers size={11} />
                {filters.carrier}
                <button
                  type="button"
                  onClick={() => onFiltersChange({ carrier: 'all' })}
                  className="hover:text-emerald-900 dark:hover:text-emerald-100 ml-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.documentType && filters.documentType !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {filters.documentType}
                <button
                  type="button"
                  onClick={() => onFiltersChange({ documentType: 'all' })}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask a question about customs regulations, shipping policies, or carrier rules..."
          className="w-full resize-none bg-transparent px-3 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 min-h-[38px] max-h-36 leading-relaxed"
        />

        {/* Controls Toolbar in Bottom of Input Box */}
        <div className="flex items-center justify-between pt-2 px-1 border-t border-zinc-100/80 dark:border-zinc-800/80 mt-1">
          {/* Left: Scope Filter Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
              title="Filter by country, carrier, or document type"
            >
              <IconFilter size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasMessages && onClearThread && (
              <button
                type="button"
                onClick={onClearThread}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <IconTrash size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Right: Submit Button */}
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            aria-label="Send query"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <IconSpinner size={16} />
            ) : (
              <IconSend size={16} />
            )}
          </button>
        </div>
      </form>

      {/* Subtext Disclaimer */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
        <IconSparkles size={11} className="text-blue-500 shrink-0" />
        <span>CargoRule AI is grounded in verified customs regulations and carrier service agreements.</span>
      </div>
    </div>
  );
};
