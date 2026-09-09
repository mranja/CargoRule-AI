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
  userId?: string;
  question: string;
  answer?: string;
  country?: string;
  carrier?: string;
  documentType?: string;
  date: string;
  createdAt?: string;
  status: 'completed' | 'processing' | 'failed';
  sources?: SourceCitation[];
  retrievedSources?: SourceCitation[];
  confidenceScore?: number;
  model?: string;
  errorMessage?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  status: 'indexed' | 'processing' | 'error';
  type: string;
  country?: string;
  carrier?: string;
  uploadedAt: string;
  updatedAt?: string;
}

export interface UploadMetadata {
  documentName: string;
  country?: string;
  carrier?: string;
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

export interface AskQueryFilters {
  country?: string;
  carrier?: string;
  documentType?: string;
}

export interface AskQueryPayload {
  question: string;
  filters?: AskQueryFilters;
}

export interface SourceCitation {
  id: string;
  chunkId?: string;
  documentId?: string;
  documentName?: string;
  documentTitle: string;
  section?: string;
  pageNumber?: number | string;
  country?: string;
  carrier?: string;
  documentType?: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface AskQueryResponse {
  id: string;
  question: string;
  answer: string;
  sources: SourceCitation[];
  timestamp: string;
  filtersUsed?: AskQueryFilters;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  filters?: AskQueryFilters;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessageItem[];
  activeFilters: AskQueryFilters;
}
