'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AskQueryFilters, AskQueryPayload, AskQueryResponse } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { AskForm } from '@/components/ask/AskForm';
import { SuggestedQuestions } from '@/components/ask/SuggestedQuestions';
import { AnswerDisplay } from '@/components/ask/AnswerDisplay';

function AskContent() {
  const searchParams = useSearchParams();
  const initialParamQuery = searchParams.get('q') || '';

  const [question, setQuestion] = useState(initialParamQuery);
  const [prevParamQuery, setPrevParamQuery] = useState(initialParamQuery);
  const [filters, setFilters] = useState<AskQueryFilters>({
    country: 'all',
    carrier: 'all',
    documentType: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<AskQueryResponse | null>(null);

  // Sync state synchronously if searchParams change
  if (initialParamQuery !== prevParamQuery) {
    setPrevParamQuery(initialParamQuery);
    setQuestion(initialParamQuery);
  }

  const handleFiltersChange = (updated: Partial<AskQueryFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectSuggestedQuestion = (suggested: string) => {
    setQuestion(suggested);
  };

  const handleReset = () => {
    setQuestion('');
    setFilters({ country: 'all', carrier: 'all', documentType: 'all' });
    setQueryResponse(null);
  };

  const handleSubmit = (payload: AskQueryPayload) => {
    setIsLoading(true);
    // Prepared for real backend RAG API dispatch (POST /ask or POST /query)
    if (process.env.NODE_ENV === 'development') {
      console.log('Dispatching compliance query payload to backend API:', payload);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ask CargoRule"
        badge="RAG POWERED"
        description="Ask questions about customs regulations, shipping policies, and carrier agreements."
      />

      {/* Suggested Questions Section */}
      <SuggestedQuestions
        onSelectQuestion={handleSelectSuggestedQuestion}
        disabled={isLoading}
      />

      {/* Question Form Input Area */}
      <AskForm
        question={question}
        onQuestionChange={setQuestion}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        isLoading={isLoading}
      />

      {/* Answer & Sources Display */}
      <AnswerDisplay response={queryResponse} isLoading={isLoading} />
    </div>
  );
}

export default function AskPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-zinc-400 font-medium">
            Loading CargoRule AI Assistant...
          </div>
        }
      >
        <AskContent />
      </Suspense>
    </DashboardLayout>
  );
}
