'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconAsk, IconSparkles } from '../common/Icons';

const suggestedQuestions = [
  'What documents are required for export?',
  'Can I ship lithium batteries?',
  'What are Germany import requirements?',
];

export const QuickQuerySection: React.FC = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
          <IconSparkles size={16} />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Ask CargoRule Compliance AI
        </h3>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        Enter shipment parameters, country regulations, or carrier restrictions to retrieve source-backed policy answers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex items-center">
          <textarea
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your compliance question... (e.g., What documents are required to ship electronics from India to Germany?)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 pr-28 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <IconAsk size={15} />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Suggested Question Chips */}
        <div>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
            Suggested Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  handleSearch(q);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
              >
                <span>&ldquo;{q}&rdquo;</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
