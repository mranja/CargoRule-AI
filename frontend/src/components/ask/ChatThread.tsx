'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessageItem } from '@/types';
import { ChatMessage } from './ChatMessage';
import {
  IconAsk,
  IconSpinner,
  IconGlobe,
  IconCarriers,
  IconFileText,
  IconSparkles,
} from '../common/Icons';

export interface ChatThreadProps {
  messages: ChatMessageItem[];
  isLoading?: boolean;
  onSelectSuggestedQuestion: (question: string) => void;
}

const starterCards = [
  {
    category: 'Customs & Tariffs',
    icon: <IconGlobe size={16} className="text-blue-600 dark:text-blue-400" />,
    title: 'EU CBAM Carbon Import Reporting',
    prompt: 'What are the import declaration and carbon reporting requirements under the EU CBAM regulation?',
  },
  {
    category: 'Dangerous Goods',
    icon: <IconFileText size={16} className="text-amber-600 dark:text-amber-400" />,
    title: 'DHL Express Lithium Battery Rules',
    prompt: 'What are the packaging, watt-hour limits, and documentation requirements for shipping lithium batteries via DHL Express?',
  },
  {
    category: 'Carrier Policies',
    icon: <IconCarriers size={16} className="text-emerald-600 dark:text-emerald-400" />,
    title: 'Maersk Reefer Temperature Protocol',
    prompt: 'What temperature monitoring and pre-trip inspection standards are mandatory for Maersk cold-chain reefer shipments?',
  },
  {
    category: 'De Minimis Exemption',
    icon: <IconSparkles size={16} className="text-purple-600 dark:text-purple-400" />,
    title: 'US CBP Section 321 Threshold',
    prompt: 'What is the Section 321 de minimis entry threshold and what goods are excluded from informal clearance in the United States?',
  },
];

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
      <div className="max-w-3xl mx-auto my-auto py-2 px-2 flex flex-col items-center text-center space-y-4 sm:space-y-5 w-full animate-in fade-in duration-300">
        {/* Claude / ChatGPT Hero Greeting */}
        <div className="space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <IconAsk size={22} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            What compliance rules can I help you check today?
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Ask questions grounded across official customs regulations, international tariff classifications, and carrier service agreements.
          </p>
        </div>

        {/* 2x2 Starter Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
          {starterCards.map((card, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestedQuestion(card.prompt)}
              className="p-3 rounded-xl border border-zinc-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 shadow-2xs transition-all cursor-pointer group space-y-1"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {card.icon}
                <span>{card.category}</span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {card.title}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {card.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4 pb-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Loading State Bubble */}
      {isLoading && (
        <div className="flex justify-start gap-3 my-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <IconAsk size={18} />
          </div>

          <div className="rounded-2xl rounded-tl-xs border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs flex items-center gap-3">
            <IconSpinner size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Searching customs vector embeddings...
              </span>
              <span className="text-[11px] text-zinc-400">
                Extracting grounded policy chunks & synthesizing compliance answer
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
