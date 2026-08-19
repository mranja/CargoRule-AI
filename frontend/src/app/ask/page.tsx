'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconAsk, IconFilter, IconSparkles } from '@/components/common/Icons';

function AskContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCarrier, setSelectedCarrier] = useState('all');

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ask CargoRule AI"
        badge="RAG POWERED"
        description="Search customs regulations, carrier agreements, and shipping restrictions using grounded AI context."
      />

      {/* Ask Interface Container */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
            <IconAsk size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Logistics Compliance Assistant
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Type your shipment parameters below to search indexed policies.
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
            <Button
              type="submit"
              disabled={!query.trim()}
              leftIcon={<IconSparkles size={16} />}
              size="lg"
            >
              Search Compliance
            </Button>
          </div>
        </form>
      </Card>

      {/* Answer & Sources Result Section (Empty State when no response) */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          AI Response & Grounded Sources
        </h3>
        <EmptyState
          title="No compliance check performed yet"
          description="Type a question above to retrieve RAG-backed compliance answers, verified customs rules, and carrier agreement citations."
          icon={<IconSparkles size={24} />}
        />
      </Card>
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
