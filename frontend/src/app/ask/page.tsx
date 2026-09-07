'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AskQueryFilters, ChatMessageItem } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChatThread } from '@/components/ask/ChatThread';
import { ChatInputBar } from '@/components/ask/ChatInputBar';
import { QueryContainer } from '@/components/query/QueryContainer';

function AskContent() {
  const searchParams = useSearchParams();
  const initialParamQuery = searchParams.get('q') || '';
  const initialParamCountry = searchParams.get('country') || 'all';

  const [activeTab, setActiveTab] = useState<'chat' | 'search'>('search');
  const [question, setQuestion] = useState(initialParamQuery);
  const [prevParamQuery, setPrevParamQuery] = useState(initialParamQuery);
  const [filters, setFilters] = useState<AskQueryFilters>({
    country: initialParamCountry,
    carrier: 'all',
    documentType: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handleSubmit = () => {
    if (!question.trim() || isLoading) return;

    const userMessageText = question.trim();
    const activeFilters = { ...filters };

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

    if (process.env.NODE_ENV === 'development') {
      console.log('Dispatching chat query payload to backend RAG API:', {
        question: userMessageText,
        filters: activeFilters,
      });
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

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-blue-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Compliance Search Workspace
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-blue-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Interactive Chat Copilot
        </button>
      </div>

      {/* View Content */}
      {activeTab === 'search' ? (
        <QueryContainer
          initialQuestion={initialParamQuery}
          initialCountry={initialParamCountry}
        />
      ) : (
        <div className="flex flex-col min-h-[calc(100vh-14rem)] justify-between space-y-6">
          <ChatThread
            messages={messages}
            isLoading={isLoading}
            onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
          />
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
      )}
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
