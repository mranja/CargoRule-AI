'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessageItem } from '@/types';
import { Card } from '../ui/Card';
import { ChatMessage } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { IconAsk, IconSpinner } from '../common/Icons';

export interface ChatThreadProps {
  messages: ChatMessageItem[];
  isLoading?: boolean;
  onSelectSuggestedQuestion: (question: string) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  isLoading = false,
  onSelectSuggestedQuestion,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 sm:p-8 space-y-4 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/20 dark:from-blue-950/20 dark:via-zinc-900 dark:to-indigo-950/10 border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
              <IconAsk size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Welcome to CargoRule AI
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your AI compliance copilot for customs regulations, shipping policies, and carrier agreements.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Type your shipment parameter or regulatory question in the chat input below to retrieve RAG-grounded policy answers verified against official logistics documentation.
          </p>
        </Card>

        {/* Suggested Prompt Chips */}
        <SuggestedQuestions
          onSelectQuestion={onSelectSuggestedQuestion}
          disabled={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[350px] pb-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Loading Bubble State when assistant is processing query */}
      {isLoading && (
        <div className="flex justify-start gap-3 my-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
            <IconAsk size={18} />
          </div>

          <div className="rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs flex items-center gap-2">
            <IconSpinner size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Searching customs vector database & generating answer...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
