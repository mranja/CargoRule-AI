'use client';

import React from 'react';
import { AskQueryFilters, AskQueryPayload } from '@/types';
import { Button } from '../ui/Button';
import { Select, SelectOption } from '../ui/Select';
import { Card } from '../ui/Card';
import { IconAsk, IconFilter, IconSparkles } from '../common/Icons';

export interface AskFormProps {
  question: string;
  onQuestionChange: (value: string) => void;
  filters: AskQueryFilters;
  onFiltersChange: (updated: Partial<AskQueryFilters>) => void;
  onSubmit: (payload: AskQueryPayload) => void;
  onReset: () => void;
  isLoading?: boolean;
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

export const AskForm: React.FC<AskFormProps> = ({
  question,
  onQuestionChange,
  filters,
  onFiltersChange,
  onSubmit,
  onReset,
  isLoading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmit({ question: question.trim(), filters });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !isLoading) {
        onSubmit({ question: question.trim(), filters });
      }
    }
  };

  return (
    <Card className="p-6 sm:p-7 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
          <IconAsk size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Logistics Compliance Assistant
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Query indexed customs regulations, shipping policies, and carrier SLAs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compliance Filter Section */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <IconFilter size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Retrieval Grounding Filters</span>
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

        {/* Question Textarea */}
        <div className="space-y-1.5">
          <label htmlFor="question-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Compliance Question *
          </label>
          <textarea
            id="question-input"
            rows={4}
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about customs requirements, shipping restrictions, documentation, or carrier policies..."
            className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 shadow-2xs leading-relaxed"
          />
          <span className="text-[11px] text-zinc-400 block text-right">
            Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Enter</kbd> to search, <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Shift+Enter</kbd> for newline
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onReset}
            disabled={isLoading || (!question && !filters.country && !filters.carrier)}
          >
            Clear Question
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!question.trim() || isLoading}
            isLoading={isLoading}
            leftIcon={<IconSparkles size={16} />}
          >
            Ask CargoRule
          </Button>
        </div>
      </form>
    </Card>
  );
};
