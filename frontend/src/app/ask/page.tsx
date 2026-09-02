'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AskQueryFilters, ChatMessageItem } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { AskForm } from '@/components/ask/AskForm';
import { SuggestedQuestions } from '@/components/ask/SuggestedQuestions';
import { AnswerDisplay } from '@/components/ask/AnswerDisplay';
import { Alert } from '@/components/ui/Alert';
import { askQuestion } from '@/services/api';
import { ChatThread } from '@/components/ask/ChatThread';
import { ChatInputBar } from '@/components/ask/ChatInputBar';

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
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

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

  const handleClearThread = () => {
    setMessages([]);
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
  };

  const handleSubmit = () => {
    if (!question.trim() || isLoading) return;

    const userMessageText = question.trim();
    const activeFilters = { ...filters };

    // Append User Message to Thread
    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      filters: activeFilters,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    // Prepared for real backend RAG API dispatch (POST /ask or POST /query)
    if (process.env.NODE_ENV === 'development') {
      console.log('Dispatching chat query payload to backend RAG API:', {
        question: userMessageText,
        filters: activeFilters,
      });
    }

    setTimeout(() => {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] justify-between space-y-6">
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
        {/* Scrollable Chat Message Thread */}
        <ChatThread
          messages={messages}
          isLoading={isLoading}
          onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
        />
      </div>

      {/* Pinned Bottom Chat Query Input Bar */}
      <ChatInputBar
        question={question}
        onQuestionChange={setQuestion}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSubmit={handleSubmit}
        onClearThread={handleClearThread}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
      />
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
