'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AskQueryFilters, AskQueryPayload, AskQueryResponse } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { AskForm } from '@/components/ask/AskForm';
import { SuggestedQuestions } from '@/components/ask/SuggestedQuestions';
import { AnswerDisplay } from '@/components/ask/AnswerDisplay';
import { Alert } from '@/components/ui/Alert';
import { askQuestion } from '@/services/api';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
  };

  const handleSubmit = async (payload: AskQueryPayload) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await askQuestion(payload);
      setQueryResponse(res);
    } catch (err) {
      console.error('RAG query error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve compliance answer. Ensure backend service is reachable.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ask CargoRule"
        badge="RAG POWERED"
        description="Ask questions about customs regulations, shipping policies, and carrier agreements."
      />

      {/* Error Alert Display */}
      {errorMessage && (
        <Alert variant="danger" title="Query Execution Failed">
          {errorMessage}
        </Alert>
      )}

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
