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
    <Card hoverable className="p-5">
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
        {isPlaceholder && <Badge variant="default">No Data</Badge>}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        {subtext}
      </p>
    </Card>
  );
};
