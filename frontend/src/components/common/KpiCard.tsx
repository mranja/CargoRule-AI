import React from 'react';
import { renderIconByName } from './Icons';

interface KpiCardProps {
  label: string;
  value?: string | number;
  subtext: string;
  iconName: string;
  isPlaceholder?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value = '--',
  subtext,
  iconName,
  isPlaceholder = true,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          {renderIconByName(iconName, { size: 18 })}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
        {isPlaceholder && (
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            No Data
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        {subtext}
      </p>
    </div>
  );
};
