export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  isAdmin?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface KpiItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  iconName: string;
}

export interface QueryRecord {
  id: string;
  question: string;
  country: string;
  carrier: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface DocumentRecord {
  id: string;
  title: string;
  status: 'indexed' | 'processing' | 'error';
  type: string;
  country: string;
  carrier: string;
  uploadedAt: string;
}

export interface UploadMetadata {
  documentName: string;
  country: string;
  carrier: string;
  documentType: string;
  effectiveDate: string;
  expiryDate: string;
  version: string;
}

export interface UploadFormErrors {
  file?: string;
  documentName?: string;
  country?: string;
  carrier?: string;
  documentType?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version?: string;
}

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export type ProcessingStepKey =
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'COMPLETED'
  | 'FAILED';

export type ProcessingStepStatus = 'completed' | 'current' | 'upcoming' | 'failed';

export interface ProcessingStep {
  key: ProcessingStepKey;
  label: string;
  description: string;
  status: ProcessingStepStatus;
  timestamp?: string;
  errorDetails?: string;
}

export interface DocumentProcessingStatus {
  documentId: string;
  documentName: string;
  currentStep: ProcessingStepKey;
  progressPercent: number;
  isComplete: boolean;
  isFailed: boolean;
  steps: ProcessingStep[];
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}
