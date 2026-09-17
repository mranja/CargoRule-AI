import React, { useState } from 'react';
import { DocumentRecord } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { IconDocuments, IconEye } from '../common/Icons';
import { DocumentDetailModal } from '../documents/DocumentDetailModal';
import { getCountryDisplayName } from '@/utils/tradeConstants';
import { CountryFlag } from '../common/CountryFlag';

export interface RecentDocumentsProps {
  documents?: DocumentRecord[];
  onUploadClick?: () => void;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  documents = [],
  onUploadClick,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  return (
    <>
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconDocuments size={18} className="text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Document Overview
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Indexed Resources ({documents.length})</span>
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
                  <th className="w-[36%] min-w-[200px] px-3.5 py-2.5">Document Title</th>
                  <th className="w-[20%] min-w-[120px] px-3.5 py-2.5">Type</th>
                  <th className="w-[16%] min-w-[100px] px-3.5 py-2.5">Country</th>
                  <th className="w-[14%] min-w-[90px] px-3.5 py-2.5">Carrier</th>
                  <th className="w-[14%] min-w-[85px] px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right min-w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconDocuments size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate" title={doc.title}>{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">{doc.type}</td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <CountryFlag country={doc.country} size="sm" />
                        <span>{getCountryDisplayName(doc.country)}</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">{doc.carrier || 'All'}</td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <Badge
                        variant={
                          doc.status === 'indexed' || doc.status === 'processed'
                            ? 'success'
                            : doc.status === 'processing'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                        title="View document details"
                      >
                        <IconEye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DocumentDetailModal
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </>
  );
};
