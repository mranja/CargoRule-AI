'use client';

import React, { useState } from 'react';
import { AskQueryFilters, AskQueryPayload, AskQueryResponse } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Select, SelectOption } from '../ui/Select';
import { CountryFilterSelect, COUNTRIES_LIST } from './CountryFilterSelect';
import { AnswerCard } from './AnswerCard';
import { SuggestedQuestions } from '../ask/SuggestedQuestions';
import { IconAsk, IconFilter, IconSearch, IconSparkles, IconSpinner } from '../common/Icons';

export interface QueryContainerProps {
  initialQuestion?: string;
  initialCountry?: string;
  onQuerySubmit?: (payload: AskQueryPayload) => Promise<AskQueryResponse | null> | void;
  className?: string;
}

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

export const QueryContainer: React.FC<QueryContainerProps> = ({
  initialQuestion = '',
  initialCountry = 'all',
  onQuerySubmit,
  className = '',
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [filters, setFilters] = useState<AskQueryFilters>({
    country: initialCountry,
    carrier: 'all',
    documentType: 'all',
  });
  const [queryState, setQueryState] = useState<
    'empty' | 'active' | 'loading' | 'success' | 'no-results' | 'error'
  >('empty');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [response, setResponse] = useState<AskQueryResponse | null>(null);

  const selectedCountryObj = COUNTRIES_LIST.find(
    (c) =>
      filters.country &&
      (c.code.toLowerCase() === filters.country.toLowerCase() ||
        c.name.toLowerCase() === filters.country.toLowerCase())
  );

  const handleCountryChange = (countryCode: string) => {
    const updatedFilters = { ...filters, country: countryCode };
    setFilters(updatedFilters);

    if (question.trim() && queryState === 'success') {
      executeSearch(question.trim(), updatedFilters);
    }
  };

  const handleFilterChange = (updated: Partial<AskQueryFilters>) => {
    const newFilters = { ...filters, ...updated };
    setFilters(newFilters);

    if (question.trim() && queryState === 'success') {
      executeSearch(question.trim(), newFilters);
    }
  };

  const handleSelectSuggestedQuestion = (suggested: string) => {
    setQuestion(suggested);
    setQueryState('active');
  };

  const handleReset = () => {
    setQuestion('');
    setFilters({ country: 'all', carrier: 'all', documentType: 'all' });
    setQueryState('empty');
    setResponse(null);
    setErrorMessage('');
  };

  const executeSearch = async (queryText: string, activeFilters: AskQueryFilters) => {
    setQueryState('loading');
    setErrorMessage('');

    const payload: AskQueryPayload = {
      question: queryText,
      filters: activeFilters,
    };

    try {
      if (onQuerySubmit) {
        const res = await onQuerySubmit(payload);
        if (res) {
          if (res.answer || (res.sources && res.sources.length > 0)) {
            setResponse(res);
            setQueryState('success');
          } else {
            setQueryState('no-results');
          }
          return;
        }
      }

      // Ready for real backend API dispatch
      setTimeout(() => {
        setQueryState('empty');
      }, 1000);
    } catch (err: unknown) {
      setQueryState('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to retrieve compliance query results.'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    executeSearch(question.trim(), filters);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search & Filter Card */}
      <Card className="p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
              <IconAsk size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Logistics Compliance Search
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Search RAG vector index for customs regulations, carrier agreements, and import restrictions.
              </p>
            </div>
          </div>

          {selectedCountryObj && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Active Country:</span>
              <Badge variant="primary" size="md">
                {selectedCountryObj.name} ({selectedCountryObj.code})
              </Badge>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Filters Bar: Country Combobox, Carrier, Document Type */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <IconFilter size={14} className="text-blue-600 dark:text-blue-400" />
                <span>RAG Retrieval Grounding Filters</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Country Filter UI */}
              <CountryFilterSelect
                selectedCountry={filters.country || 'all'}
                onCountryChange={handleCountryChange}
                disabled={queryState === 'loading'}
              />

              {/* Carrier Filter UI */}
              <Select
                label="Carrier SLA"
                options={carrierOptions}
                value={filters.carrier || 'all'}
                onChange={(e) => handleFilterChange({ carrier: e.target.value })}
                disabled={queryState === 'loading'}
              />

              {/* Document Type Filter UI */}
              <Select
                label="Document Type"
                options={documentTypeOptions}
                value={filters.documentType || 'all'}
                onChange={(e) => handleFilterChange({ documentType: e.target.value })}
                disabled={queryState === 'loading'}
              />
            </div>
          </div>

          {/* Prominent Question Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="query-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Compliance Query *
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">
                {question.length} chars
              </span>
            </div>

            <textarea
              id="query-input"
              rows={3}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (queryState === 'empty') setQueryState('active');
              }}
              disabled={queryState === 'loading'}
              placeholder="Ask about customs requirements, shipping restrictions, documentation, or carrier policies..."
              className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 shadow-2xs leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              disabled={queryState === 'loading' || (!question && filters.country === 'all')}
            >
              Clear Query
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!question.trim() || queryState === 'loading'}
              isLoading={queryState === 'loading'}
              leftIcon={
                queryState === 'loading' ? (
                  <IconSpinner size={16} />
                ) : (
                  <IconSearch size={16} />
                )
              }
            >
              {queryState === 'loading' ? 'Searching Database...' : 'Search Compliance'}
            </Button>
          </div>
        </form>

        {/* Suggested Question Chips */}
        <SuggestedQuestions
          onSelectQuestion={handleSelectSuggestedQuestion}
          disabled={queryState === 'loading'}
        />
      </Card>

      {/* Query Result State Container */}
      <div>
        {queryState === 'loading' && (
          <AnswerCard isLoading={true} />
        )}

        {queryState === 'error' && (
          <AnswerCard isError={true} errorMessage={errorMessage} />
        )}

        {queryState === 'no-results' && (
          <Card className="p-7">
            <EmptyState
              title={`No matching compliance documents found${selectedCountryObj ? ` for ${selectedCountryObj.name}` : ''}`}
              description="No indexed customs regulations or carrier agreements matched your specific query parameters. Try broadening your keywords or resetting the country filter."
              icon={<IconSparkles size={24} />}
              actionLabel="Reset All Filters"
              onAction={handleReset}
            />
          </Card>
        )}

        {queryState === 'success' && response && (
          <AnswerCard response={response} />
        )}

        {queryState === 'empty' && (
          <AnswerCard response={null} />
        )}
      </div>
    </div>
  );
};
