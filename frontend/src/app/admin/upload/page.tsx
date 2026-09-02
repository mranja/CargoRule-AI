'use client';

import React, { useState } from 'react';
import {
  DocumentProcessingStatus,
  ProcessingStep,
  UploadFormErrors,
  UploadMetadata,
  UploadStatus,
} from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FileDropzone } from '@/components/documents/FileDropzone';
import { FilePreview } from '@/components/documents/FilePreview';
import { DocumentMetadataForm } from '@/components/documents/DocumentMetadataForm';
import { UploadSummary } from '@/components/documents/UploadSummary';
import { UploadGuidelines } from '@/components/documents/UploadGuidelines';
import { ProcessingStatusStepper } from '@/components/documents/ProcessingStatusStepper';
import { IconUpload, IconSparkles } from '@/components/common/Icons';
import { useRouter } from 'next/navigation';
import { uploadDocument } from '@/services/api';

const initialMetadata: UploadMetadata = {
  documentName: '',
  country: 'Global',
  carrier: 'All',
  documentType: 'Customs Regulation',
  effectiveDate: '',
  expiryDate: '',
  version: '1.0',
};

const MAX_FILE_SIZE_MB = 25;
const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt'];

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<UploadMetadata>(initialMetadata);
  const [errors, setErrors] = useState<UploadFormErrors>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeProcessingStatus, setActiveProcessingStatus] =
    useState<DocumentProcessingStatus | null>(null);

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMB = file.size / (1024 * 1024);

    const newErrors: UploadFormErrors = {};

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      newErrors.file = `Unsupported file format (.${ext}). Supported formats: PDF, DOCX, TXT.`;
      setErrors(newErrors);
      return;
    }

    if (sizeMB > MAX_FILE_SIZE_MB) {
      newErrors.file = `File size (${sizeMB.toFixed(1)}MB) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`;
      setErrors(newErrors);
      return;
    }

    setSelectedFile(file);
    setErrors({});
    setUploadStatus('idle');

    // Auto-populate document name if empty
    if (!metadata.documentName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setMetadata((prev) => ({
        ...prev,
        documentName: cleanName,
      }));
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setErrors({});
    setUploadStatus('idle');
    setActiveProcessingStatus(null);
    setStatusMessage('');
  };

  const handleMetadataChange = (updated: Partial<UploadMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updated }));
    const fields = Object.keys(updated) as (keyof UploadFormErrors)[];
    if (fields.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        fields.forEach((f) => delete next[f]);
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: UploadFormErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a logistics document file to upload.';
    }

    if (!metadata.documentName.trim()) {
      newErrors.documentName = 'Document name is required.';
    }

    if (!metadata.documentType) {
      newErrors.documentType = 'Please select a document type.';
    }

    if (metadata.effectiveDate && metadata.expiryDate) {
      const start = new Date(metadata.effectiveDate);
      const end = new Date(metadata.expiryDate);
      if (end < start) {
        newErrors.expiryDate = 'Expiry date cannot be earlier than the effective date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedFile) {
      setUploadStatus('validating');
      return;
    }

    setUploadStatus('uploading');
    setStatusMessage('Uploading and indexing document into RAG vector store...');

    const initialSteps: ProcessingStep[] = [
      {
        key: 'UPLOADED',
        label: 'File Upload',
        description: 'Document uploaded to server',
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        key: 'EXTRACTING',
        label: 'Text Extraction',
        description: 'Extracting content and structure',
        status: 'current',
      },
      {
        key: 'CHUNKING',
        label: 'Section Chunking',
        description: 'Segmenting into compliance chunks',
        status: 'upcoming',
      },
      {
        key: 'EMBEDDING',
        label: 'Vector Embedding',
        description: 'Generating dense vector representations',
        status: 'upcoming',
      },
      {
        key: 'INDEXING',
        label: 'Vector Database Index',
        description: 'Indexing in vector store for search',
        status: 'upcoming',
      },
    ];

    setActiveProcessingStatus({
      documentId: 'doc_pending',
      documentName: metadata.documentName,
      currentStep: 'EXTRACTING',
      progressPercent: 30,
      isComplete: false,
      isFailed: false,
      steps: initialSteps,
    });

    try {
      const res = await uploadDocument(selectedFile, metadata);

      // Complete all steps
      const completedSteps: ProcessingStep[] = [
        {
          key: 'UPLOADED',
          label: 'File Upload',
          description: 'Document uploaded to server',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          key: 'EXTRACTING',
          label: 'Text Extraction',
          description: 'Text cleaned and normalized',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          key: 'CHUNKING',
          label: 'Section Chunking',
          description: 'Segmented with overlap & metadata',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          key: 'EMBEDDING',
          label: 'Vector Embedding',
          description: 'Embedded with OpenAI-compatible model',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          key: 'INDEXING',
          label: 'Vector Database Index',
          description: 'Indexed in vector store with filters',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        },
      ];

      setActiveProcessingStatus({
        documentId: res.documentId || 'doc_indexed',
        documentName: metadata.documentName,
        currentStep: 'COMPLETED',
        progressPercent: 100,
        isComplete: true,
        isFailed: false,
        steps: completedSteps,
      });

      setUploadStatus('success');
      setStatusMessage(
        res.message ||
          'Document uploaded, chunked, embedded, and indexed in vector store successfully!'
      );
    } catch (err) {
      console.error('Upload failed:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Upload and indexing failed.';
      setUploadStatus('error');
      setStatusMessage(errMsg);

      setActiveProcessingStatus((prev) =>
        prev
          ? {
              ...prev,
              currentStep: 'FAILED',
              isFailed: true,
              errorMessage: errMsg,
              steps: prev.steps.map((s) =>
                s.status === 'current' ? { ...s, status: 'failed' } : s
              ),
            }
          : null
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Upload Documents"
          badge="ADMIN FEATURE"
          description="Upload customs regulations, shipping policies, and carrier agreements to index them in the CargoRule RAG vector database."
        />

        {/* Guidelines Panel */}
        <UploadGuidelines />

        {/* Status Alert Banners */}
        {uploadStatus === 'success' && (
          <Alert
            variant="success"
            title="Upload Complete"
            icon={<IconSparkles size={18} />}
          >
            {statusMessage || 'Document uploaded and indexed successfully.'}
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert variant="danger" title="Upload Failed">
            {statusMessage || 'Failed to upload document. Please verify parameters and try again.'}
          </Alert>
        )}

        {/* Active Processing Stepper Display (when active document processing status is present) */}
        {activeProcessingStatus && (
          <ProcessingStatusStepper
            status={activeProcessingStatus}
            onReset={handleFileRemove}
            onViewDocuments={() => router.push('/admin/documents')}
          />
        )}

        {/* Main Upload Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              1. Document Selection
            </h3>

            {!selectedFile ? (
              <FileDropzone
                onFileSelect={handleFileSelect}
                acceptedFormats={['PDF', 'DOCX', 'TXT']}
                maxSizeMB={MAX_FILE_SIZE_MB}
                disabled={uploadStatus === 'uploading'}
                error={errors.file}
              />
            ) : (
              <FilePreview
                file={selectedFile}
                onRemove={handleFileRemove}
                disabled={uploadStatus === 'uploading'}
              />
            )}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                2. Compliance Metadata
              </h3>

              <DocumentMetadataForm
                metadata={metadata}
                onChange={handleMetadataChange}
                errors={errors}
                disabled={uploadStatus === 'uploading'}
              />
            </div>
          </Card>

          {/* Upload Pre-submission Summary */}
          {selectedFile && (
            <UploadSummary file={selectedFile} metadata={metadata} />
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedFile ? (
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Ready to process: {selectedFile.name}
                </span>
              ) : (
                <span>Please select a document file above to enable upload.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleFileRemove}
                  disabled={uploadStatus === 'uploading'}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!selectedFile || uploadStatus === 'uploading'}
                isLoading={uploadStatus === 'uploading'}
                leftIcon={<IconUpload size={16} />}
              >
                {uploadStatus === 'uploading' ? 'Uploading Document...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
