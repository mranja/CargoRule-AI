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
  status: 'indexed' | 'processing' | 'error' | 'processed' | 'failed';
  type: string;
  country?: string;
  carrier?: string;
  uploadedAt: string;
  updatedAt?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version?: string;
  chunkCount?: number;
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
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

export interface CountryOption {
  code: string;
  name: string;
  region?: string;
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

export interface DailyProcessingStats {
  date: string;
  total: number;
  processed: number;
  failed: number;
  processing: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  fileName?: string;
  status: 'indexed' | 'processing' | 'error' | 'processed' | 'failed';
  chunkCount: number;
  uploadedAt: string;
  updatedAt?: string;
  errorMessage?: string;
  country?: string;
  carrier?: string;
  type?: string;
}

export interface DocumentProcessingStats {
  totalDocuments: number;
  processedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  successRate: number;
  failureRate: number;
  recentActivity: RecentActivityItem[];
  processingOverTime: DailyProcessingStats[];
}

export interface DocumentSyncItem {
  documentId: string;
  title: string;
  chunkCount: number;
  vectorCount: number;
  status: string;
  isConsistent: boolean;
  country?: string;
  carrier?: string;
}

export interface IndexingConsistencyStats {
  successfullyIndexed: number;
  missingOrInconsistent: number;
  orphanedVectors: number;
  isConsistent: boolean;
  perDocument: DocumentSyncItem[];
}

export interface CategoryDistribution {
  name: string;
  documentCount: number;
  chunkCount: number;
  vectorCount: number;
}

export interface DocumentVectorStats {
  totalDocumentsStored: number;
  totalChunksGenerated: number;
  totalVectorsStored: number;
  averageVectorsPerDocument: number;
  averageChunksPerDocument: number;
  indexingConsistency: IndexingConsistencyStats;
  distributions: {
    byCarrier: CategoryDistribution[];
    byCountry: CategoryDistribution[];
    byDocumentType: CategoryDistribution[];
  };
  vectorDbHealth: {
    status: 'connected' | 'degraded' | 'error';
    latencyMs: number;
    totalVectors: number;
    lastChecked: string;
  };
}

export interface QueryAnalyticsStats {
  totalQueries: number;
  queriesToday: number;
  queriesThisWeek: number;
  queriesWithSources: number;
  zeroSourceQueries: number;
  totalSourcesRetrieved: number;
  avgSourcesPerQuery: number;
  mostQueriedCarriers: Array<{ name: string; count: number }>;
  mostQueriedCountries: Array<{ name: string; count: number }>;
  queriesOverTime: Array<{ date: string; count: number }>;
}

export interface SubsystemHealth {
  backendApi: { status: 'healthy' | 'degraded' | 'error'; uptime?: number; latencyMs?: number };
  documentStore: { status: 'healthy' | 'degraded' | 'error'; totalDocuments: number; indexedDocuments: number };
  vectorDatabase: { status: 'connected' | 'degraded' | 'error'; latencyMs: number; totalVectors: number; lastChecked: string };
  embeddingEngine: { status: 'healthy' | 'degraded' | 'mock' | 'error'; mode: string; dimensions: number };
  llmSubsystem: { status: 'healthy' | 'degraded' | 'configured' | 'mock' | 'error'; model: string };
}

export interface UnifiedActivityItem {
  id: string;
  type: 'document_upload' | 'document_processed' | 'document_failed' | 'document_updated' | 'document_deleted' | 'query_executed';
  title: string;
  description: string;
  timestamp: string;
  status?: 'indexed' | 'processing' | 'error' | 'completed' | 'failed' | 'processed';
  metadata?: Record<string, unknown>;
}

export interface AdminDashboardStats {
  processing: DocumentProcessingStats;
  vectorDatabase: DocumentVectorStats;
  queries?: QueryAnalyticsStats;
  subsystemHealth?: SubsystemHealth;
  activityFeed?: UnifiedActivityItem[];
  generatedAt: string;
}
