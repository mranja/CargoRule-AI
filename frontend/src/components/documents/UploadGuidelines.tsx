import React from 'react';
import { Card } from '../ui/Card';
import { IconSparkles } from '../common/Icons';

export const UploadGuidelines: React.FC = () => {
  return (
    <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/20 dark:via-zinc-900 dark:to-indigo-950/10 border-blue-100 dark:border-blue-900/40">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400">
          <IconSparkles size={16} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Compliance Document Guidelines
        </h3>
      </div>

      <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 list-disc list-inside leading-relaxed">
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Official Compliance Documents:</strong> Upload authorized customs regulations, shipping policy briefs, or carrier service level agreements.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Accurate Metadata:</strong> Assign correct country and carrier tags to enable targeted RAG vector filtering.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Versioning:</strong> Keep version numbers updated when uploading policy revisions.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">RAG Accuracy:</strong> Outdated or duplicate policy documents may degrade compliance query precision.
        </li>
      </ul>
    </Card>
  );
};
