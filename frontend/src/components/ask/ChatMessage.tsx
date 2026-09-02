'use client';

import React, { useState } from 'react';
import { ChatMessageItem } from '@/types';
import { Badge } from '../ui/Badge';
import { SourceCard } from './SourceCard';
import {
  IconAsk,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconThumbsDown,
  IconThumbsUp,
  IconUser,
} from '../common/Icons';

export interface ChatMessageProps {
  message: ChatMessageItem;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

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
              <Badge variant="default" size="sm">
                {message.filters.country}
              </Badge>
            )}
            {message.filters?.carrier && message.filters.carrier !== 'all' && (
              <Badge variant="primary" size="sm">
                {message.filters.carrier}
              </Badge>
            )}
            <span className="text-[10px] text-zinc-400 font-mono">
              {message.timestamp}
            </span>
          </div>

          <div className="rounded-2xl rounded-tr-none bg-blue-600 px-4 py-3 text-xs sm:text-sm text-white shadow-2xs leading-relaxed">
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
    <div className="flex justify-start gap-3 my-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
        <IconAsk size={18} />
      </div>

      <div className="flex flex-col max-w-[90%] sm:max-w-[80%] space-y-3">
        {/* Assistant Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            CargoRule AI
          </span>
          <Badge variant="primary" size="sm">
            RAG Grounded
          </Badge>
          <span className="text-[10px] text-zinc-400 font-mono">
            {message.timestamp}
          </span>
        </div>

        {/* Answer Content Card */}
        <div className="rounded-2xl rounded-tl-none border border-zinc-200/80 bg-white p-4 sm:p-5 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-2xs leading-relaxed space-y-4">
          <div className="prose prose-xs dark:prose-invert max-w-none space-y-2 whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Grounded Sources Section */}
          {message.sources && message.sources.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <IconSparkles size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Sources Cited ({message.sources.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {message.sources.map((src) => (
                  <SourceCard key={src.id} source={src} />
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
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
