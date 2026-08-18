import React from 'react';
import { DocumentRecord } from '@/types';
import { EmptyState } from '../common/EmptyState';
import { IconDocuments } from '../common/Icons';

interface DocumentOverviewSectionProps {
  documents?: DocumentRecord[];
  onUploadClick?: () => void;
}

export const DocumentOverviewSection: React.FC<DocumentOverviewSectionProps> = ({
  documents = [],
  onUploadClick,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconDocuments size={18} className="text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Document Overview
          </h3>
        </div>
        <span className="text-xs text-zinc-400">Indexed Resources</span>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents available yet"
          description="Upload customs guidelines, carrier service agreements, or country restrictions to enable AI rag querying."
          icon={<IconDocuments size={24} />}
          actionLabel="Upload Document"
          onAction={onUploadClick}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] uppercase font-semibold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-3 py-2.5">Document Title</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Country</th>
                <th className="px-3 py-2.5">Carrier</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                    {doc.title}
                  </td>
                  <td className="px-3 py-3">{doc.type}</td>
                  <td className="px-3 py-3">{doc.country || 'Global'}</td>
                  <td className="px-3 py-3">{doc.carrier || 'All'}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        doc.status === 'indexed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : doc.status === 'processing'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
