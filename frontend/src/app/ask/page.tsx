'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AskQueryFilters, ChatMessageItem } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Alert } from '@/components/ui/Alert';
import { askQuestion } from '@/services/api';
import { ChatThread } from '@/components/ask/ChatThread';
import { ChatInputBar } from '@/components/ask/ChatInputBar';

function AskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialParamQuery = searchParams.get('q') || '';
  const initialParamCarrier = searchParams.get('carrier') || 'all';
  const initialParamCountry = searchParams.get('country') || 'all';

  const [question, setQuestion] = useState(initialParamQuery);
  const [prevParamQuery, setPrevParamQuery] = useState(initialParamQuery);
  const [filters, setFilters] = useState<AskQueryFilters>({
    country: initialParamCountry,
    carrier: initialParamCarrier,
    documentType: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
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
    setErrorMessage(null);
    router.replace('/ask');
  };

  const handleSubmit = async () => {
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
    setErrorMessage(null);

    try {
      const res = await askQuestion({
        question: userMessageText,
        filters: activeFilters,
      });

      const assistantMessage: ChatMessageItem = {
        id: res.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('RAG query error:', err);
      const errText =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve compliance answer. Ensure backend service is reachable.';
      setErrorMessage(errText);

      const errorItem: ChatMessageItem = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorItem]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden justify-between space-y-2">
      {/* Error Alert Display */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto w-full shrink-0">
          <Alert variant="danger" title="Query Execution Failed">
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* Chat Thread Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1 flex flex-col">
        <ChatThread
          messages={messages}
          isLoading={isLoading}
          onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
        />
      </div>

      {/* Pinned Bottom Chat Query Dock */}
      <div className="shrink-0 pt-1">
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
    </div>
  );
}

export default function AskPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-zinc-400 font-medium">
            Loading CargoRule AI Copilot...
          </div>
        }
      >
        <AskContent />
      </Suspense>
    </DashboardLayout>
  );
}
