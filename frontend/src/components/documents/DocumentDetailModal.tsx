'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentRecord, DocumentChunkRecord } from '@/types';
import { getDocumentById } from '@/services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  IconClose,
  IconDocuments,
  IconGlobe,
  IconCarriers,
  IconAsk,
  IconCheck,
  IconAlertCircle,
  IconCpu,
  IconEye,
} from '../common/Icons';
import { getCountryDisplayName } from '@/utils/tradeConstants';
import { CountryFlag } from '../common/CountryFlag';

interface DocumentDetailModalProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [detailDoc, setDetailDoc] = useState<DocumentRecord | null>(document);
  const [chunks, setChunks] = useState<DocumentChunkRecord[]>([]);
  const [showFullText, setShowFullText] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (!document) return;
    setDetailDoc(document);
    setShowFullText(false);

    let isMounted = true;
    const fetchFullDetails = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await getDocumentById(document.id);
        if (isMounted && res) {
          setDetailDoc((prev) => ({
            ...(prev || document),
            ...res.document,
            summary: res.document.summary || prev?.summary || document.summary,
            keyRequirements: res.document.keyRequirements || prev?.keyRequirements || document.keyRequirements,
          }));
          setChunks(res.chunks || []);
        }
      } catch (err) {
        console.warn('Failed to load document details:', err);
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    };

    fetchFullDetails();
    return () => {
      isMounted = false;
    };
  }, [document]);

  if (!isOpen || !document) return null;
  const activeDoc = detailDoc || document;

  const handleAskAboutDoc = () => {
    onClose();
    const query = encodeURIComponent(`What are the key compliance requirements and rules in "${document.title}"?`);
    const country = encodeURIComponent(document.country || 'all');
    const carrier = encodeURIComponent(document.carrier || 'all');
    router.push(`/ask?q=${query}&country=${country}&carrier=${carrier}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl z-10 dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 mt-0.5">
              <IconDocuments size={20} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                  {document.type || 'Customs Regulation'}
                </span>
                <Badge
                  variant={
                    document.status === 'indexed' || document.status === 'processed'
                      ? 'success'
                      : document.status === 'processing'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {document.status}
                </Badge>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug break-words">
                {document.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
            aria-label="Close modal"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Metadata Details Grid */}
        <div className="py-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
              <IconGlobe size={13} className="shrink-0 text-zinc-400" />
              Country / Region
            </span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
              <CountryFlag country={document.country} size="sm" />
              <span>{getCountryDisplayName(document.country)}</span>
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
              <IconCarriers size={13} className="shrink-0 text-zinc-400" />
              Carrier
            </span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {document.carrier || 'All Carriers'}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
              <IconCpu size={13} className="shrink-0 text-zinc-400" />
              Vector Chunks
            </span>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono truncate">
              {document.chunkCount || 1} chunks indexed
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Effective Date</span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
              {document.effectiveDate || 'Immediate'}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Expiry Date</span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
              {document.expiryDate || 'Indefinite'}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 border border-zinc-100/80 dark:border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Version</span>
            <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
              v{document.version || '1.0'}
            </p>
          </div>
        </div>

        {/* Document Content & Regulatory Summary */}
        <div className="py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Document Summary & Regulatory Scope</span>
            </h4>
            {chunks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFullText(!showFullText)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <IconEye size={13} />
                <span>{showFullText ? 'Hide Document Text' : `View Full Content (${chunks.length} sections)`}</span>
              </button>
            )}
          </div>

          <div className="rounded-xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 p-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {isLoadingDetail ? (
              <div className="py-2 text-center text-xs text-zinc-400 animate-pulse">
                Extracting summary from document...
              </div>
            ) : (
              <>
                <p className="text-zinc-800 dark:text-zinc-200 font-normal leading-relaxed">
                  {activeDoc.summary ||
                    'Outlines mandatory customs clearance procedures, required commercial documentation, and compliance protocols specified in this regulatory resource.'}
                </p>

                {/* Key Requirements directly extracted from document */}
                {activeDoc.keyRequirements && activeDoc.keyRequirements.length > 0 && (
                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Key Mandates & Requirements
                    </span>
                    <ul className="space-y-1.5">
                      {activeDoc.keyRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300 text-xs">
                          <span className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <IconCheck size={13} />
                          </span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activeDoc.fileName && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400 font-mono flex-wrap">
                <span>File: {activeDoc.fileName}</span>
                {activeDoc.fileSize && (
                  <span>• {(activeDoc.fileSize / 1024).toFixed(1)} KB</span>
                )}
                <span>• {activeDoc.chunkCount || chunks.length || 1} vector chunks</span>
              </div>
            )}
          </div>

          {/* Full Parsed Document Sections Drawer */}
          {showFullText && chunks.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-150 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Parsed Document Text ({chunks.length} indexed chunks)
              </span>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs space-y-1">
                {chunks.map((chunk, idx) => (
                  <div key={chunk.id || idx} className="p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <span>{chunk.metadata?.section || `Section ${idx + 1}`}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Chunk #{idx + 1}</span>
                    </div>
                    <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-300 leading-relaxed text-[11px]">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconAsk size={15} />}
            onClick={handleAskAboutDoc}
          >
            Ask AI About This Document
          </Button>
        </div>
      </div>
    </div>
  );
};
