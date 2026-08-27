import React from 'react';
import { IconSparkles } from '../common/Icons';

export interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const suggestedPrompts = [
  'What documents are required for an international shipment?',
  'What are the import requirements for Germany?',
  'Are lithium batteries allowed for this shipment?',
  'What are the customs valuation rules for commercial invoices?',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        <IconSparkles size={14} className="text-blue-600 dark:text-blue-400" />
        <span>Suggested Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(prompt)}
            className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
