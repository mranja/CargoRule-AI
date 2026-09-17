'use client';

import React, { useState } from 'react';
import { ChatMessageItem } from '@/types';
import { Badge } from '../ui/Badge';
import {
  IconAsk,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconThumbsDown,
  IconThumbsUp,
  IconUser,
  IconDocuments,
  IconChevronRight,
} from '../common/Icons';
import { getCountryDisplayName } from '@/utils/tradeConstants';
import { CountryFlag } from '../common/CountryFlag';

export interface ChatMessageProps {
  message: ChatMessageItem;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 my-4">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] space-y-1.5">
          <div className="flex items-center gap-2">
            {message.filters?.country && message.filters.country !== 'all' && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {message.filters.country}
              </span>
            )}
            {message.filters?.carrier && message.filters.carrier !== 'all' && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {message.filters.carrier}
              </span>
            )}
            <span className="text-[10px] text-zinc-400 font-mono">
              {message.timestamp}
            </span>
          </div>

          <div className="rounded-2xl rounded-tr-xs bg-blue-600 px-4 py-3 text-sm text-white shadow-xs leading-relaxed">
            {message.content}
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <IconUser size={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 my-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
        <IconAsk size={18} />
      </div>

      <div className="flex flex-col max-w-[92%] sm:max-w-[85%] space-y-3">
        {/* Assistant Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            CargoRule AI
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            RAG Grounded
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {message.timestamp}
          </span>
        </div>

        {/* Answer Content Card */}
        <div className="rounded-2xl rounded-tl-xs border border-zinc-200 bg-white p-5 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs leading-relaxed space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Claude-style Grounded Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <IconSparkles size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Verified Sources Cited ({message.sources.length})</span>
              </div>

              <div className="space-y-2">
                {message.sources.map((src, idx) => {
                  const isExpanded = expandedSourceId === (src.id || String(idx));
                  return (
                    <div
                      key={src.id || idx}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800/80 dark:bg-zinc-950/40 p-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSourceId(isExpanded ? null : src.id || String(idx))
                        }
                        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {src.documentTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {src.relevanceScore !== undefined && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                              {Math.round(src.relevanceScore * 100)}% match
                            </span>
                          )}
                          <IconChevronRight
                            size={14}
                            className={`text-zinc-400 transform transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1 text-xs animate-in fade-in duration-100">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                            {src.country && (
                              <span className="inline-flex items-center gap-1">
                                <span>Country:</span>
                                <CountryFlag country={src.country} size="xs" />
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{getCountryDisplayName(src.country)}</span>
                              </span>
                            )}
                            {src.carrier && <span>• Carrier: {src.carrier}</span>}
                            {src.section && <span>• Section: {src.section}</span>}
                            {src.pageNumber && <span>• Page: {src.pageNumber}</span>}
                          </div>
                          {src.snippet && (
                            <p className="text-zinc-600 dark:text-zinc-300 italic bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 text-[11px] leading-relaxed">
                              &ldquo;{src.snippet}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-2 text-xs text-zinc-400 border-t border-zinc-100/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Copy answer"
              >
                {copied ? (
                  <>
                    <IconCheck size={14} className="text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={14} />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFeedback('up')}
                className={`rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                  feedback === 'up' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-400'
                }`}
                title="Helpful"
              >
                <IconThumbsUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => setFeedback('down')}
                className={`rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                  feedback === 'down' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-400'
                }`}
                title="Not helpful"
              >
                <IconThumbsDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
