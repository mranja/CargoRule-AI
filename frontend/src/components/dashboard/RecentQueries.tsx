import React from 'react';
import { QueryRecord } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { IconHistory } from '../common/Icons';

export interface RecentQueriesProps {
  queries?: QueryRecord[];
  onAskClick?: () => void;
}

export const RecentQueries: React.FC<RecentQueriesProps> = ({
  queries = [],
  onAskClick,
}) => {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconHistory size={18} className="text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Queries
          </h3>
        </div>
        <span className="text-xs text-zinc-400">Activity Log</span>
      </div>

      {queries.length === 0 ? (
        <EmptyState
          title="No queries yet"
          description="Ask CargoRule AI a question to check customs regulations, dangerous goods rules, or carrier policies."
          icon={<IconHistory size={24} />}
          actionLabel="Ask First Question"
          onAction={onAskClick}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] uppercase font-semibold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-3 py-2.5">Question</th>
                <th className="px-3 py-2.5">Country</th>
                <th className="px-3 py-2.5">Carrier</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {queries.map((q) => (
                <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                    {q.question}
                  </td>
                  <td className="px-3 py-3">{q.country || '--'}</td>
                  <td className="px-3 py-3">{q.carrier || '--'}</td>
                  <td className="px-3 py-3 text-zinc-400">{q.date}</td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        q.status === 'completed'
                          ? 'success'
                          : q.status === 'processing'
                          ? 'primary'
                          : 'danger'
                      }
                    >
                      {q.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
