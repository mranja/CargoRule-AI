import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { renderIconByName } from '../common/Icons';

export interface MetricCardProps {
  label: string;
  value?: string | number;
  subtext: string;
  iconName: string;
  isPlaceholder?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value = '--',
  subtext,
  iconName,
  isPlaceholder = true,
}) => {
  return (
    <Card hoverable className="p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.06] text-blue-600 dark:text-blue-400 border border-zinc-200/60 dark:border-white/[0.08] group-hover:scale-105 transition-transform duration-200">
          {renderIconByName(iconName, { size: 18 })}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
          {value}
        </span>
        {isPlaceholder ? (
          <Badge variant="default" className="text-[10px] py-0 px-1.5 font-medium">Pending</Badge>
        ) : (
          <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
        <span className="h-1 w-1 rounded-full bg-blue-500/60" />
        <span>{subtext}</span>
      </p>
    </Card>
  );
};
