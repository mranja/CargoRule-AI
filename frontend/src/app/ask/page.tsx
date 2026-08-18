'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { IconAsk, IconFilter, IconSparkles } from '@/components/common/Icons';

function AskContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCarrier, setSelectedCarrier] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Ask Interface Container */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
            <IconAsk size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Ask CargoRule AI
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              RAG-based question answering for customs regulations, carrier agreements, and shipping restrictions.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 mb-4 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <IconFilter size={14} />
            <span>Filters:</span>
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">All Countries</option>
            <option value="de">Germany (DE)</option>
            <option value="in">India (IN)</option>
            <option value="us">United States (US)</option>
          </select>

          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">All Carriers</option>
            <option value="dhl">DHL Express</option>
            <option value="fedex">FedEx</option>
            <option value="maersk">Maersk</option>
          </select>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Can I ship lithium batteries from India to Germany using DHL?"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconSparkles size={16} />
              <span>Search Compliance</span>
            </button>
          </div>
        </form>
      </div>

      {/* Answer & Sources Result Section (Empty State when no response) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          AI Response & Grounded Sources
        </h3>
        <EmptyState
          title="No compliance check performed yet"
          description="Type a question above to retrieve RAG-backed compliance answers, verified customs rules, and carrier agreement citations."
          icon={<IconSparkles size={24} />}
        />
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading AI Assistant...</div>}>
        <AskContent />
      </Suspense>
    </DashboardLayout>
  );
}
