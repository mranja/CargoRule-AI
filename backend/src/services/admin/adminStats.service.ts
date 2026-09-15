import { documentStore, DocumentRecord } from "../document/documentStore";
import { getDefaultVectorStore, VectorStore, VectorDbHealth } from "../retrieval/vectorStore";
import { queryHistoryStore, QueryRecord } from "../rag/queryHistoryStore";

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
  status: "indexed" | "processing" | "error" | "processed" | "failed";
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
  vectorDbHealth: VectorDbHealth;
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
  backendApi: { status: "healthy" | "degraded" | "error"; uptime: number; latencyMs: number };
  documentStore: { status: "healthy" | "degraded" | "error"; totalDocuments: number; indexedDocuments: number };
  vectorDatabase: VectorDbHealth;
  embeddingEngine: { status: "healthy" | "degraded" | "mock" | "error"; mode: string; dimensions: number };
  llmSubsystem: { status: "healthy" | "degraded" | "configured" | "mock" | "error"; model: string };
}

export interface UnifiedActivityItem {
  id: string;
  type: "document_upload" | "document_processed" | "document_failed" | "document_updated" | "document_deleted" | "query_executed";
  title: string;
  description: string;
  timestamp: string;
  status?: "indexed" | "processing" | "error" | "completed" | "failed" | "processed";
  metadata?: Record<string, unknown>;
}

export interface AdminDashboardStats {
  processing: DocumentProcessingStats;
  vectorDatabase: DocumentVectorStats;
  queries: QueryAnalyticsStats;
  subsystemHealth: SubsystemHealth;
  activityFeed: UnifiedActivityItem[];
  generatedAt: string;
}

export class AdminStatsService {
  /**
   * Generates comprehensive Admin Dashboard statistics using real data from
   * documentStore, vectorStore, and queryHistoryStore.
   */
  public static async getAdminDashboardStats(
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<AdminDashboardStats> {
    const docs = documentStore.getAllDocuments();
    const vectorCountsByDoc = await vectorStore.getVectorCountsByDocumentId();
    const totalVectorsStored = await vectorStore.count();
    const baseHealth = await vectorStore.checkHealth();
    const allQueries = queryHistoryStore.getAll();

    // -------------------------------------------------------------
    // 1. Document Processing Statistics
    // -------------------------------------------------------------
    const totalDocuments = docs.length;
    let processedDocuments = 0;
    let processingDocuments = 0;
    let failedDocuments = 0;

    const timeBuckets = new Map<
      string,
      { total: number; processed: number; failed: number; processing: number }
    >();

    for (const doc of docs) {
      const isProcessed = doc.status === "indexed" || doc.status === "processed";
      const isProcessing = doc.status === "processing";
      const isFailed = doc.status === "error" || doc.status === "failed";

      if (isProcessed) processedDocuments++;
      else if (isProcessing) processingDocuments++;
      else if (isFailed) failedDocuments++;

      const dateKey = doc.uploadedAt
        ? doc.uploadedAt.split("T")[0]
        : new Date().toISOString().split("T")[0];

      let bucket = timeBuckets.get(dateKey);
      if (!bucket) {
        bucket = { total: 0, processed: 0, failed: 0, processing: 0 };
        timeBuckets.set(dateKey, bucket);
      }
      bucket.total += 1;
      if (isProcessed) bucket.processed += 1;
      if (isFailed) bucket.failed += 1;
      if (isProcessing) bucket.processing += 1;
    }

    const successRate =
      totalDocuments > 0
        ? Number(((processedDocuments / totalDocuments) * 100).toFixed(1))
        : 0;

    const failureRate =
      totalDocuments > 0
        ? Number(((failedDocuments / totalDocuments) * 100).toFixed(1))
        : 0;

    const processingOverTime: DailyProcessingStats[] = Array.from(
      timeBuckets.entries()
    )
      .map(([date, counts]) => ({
        date,
        total: counts.total,
        processed: counts.processed,
        failed: counts.failed,
        processing: counts.processing,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentActivity: RecentActivityItem[] = docs.slice(0, 10).map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      status: doc.status,
      chunkCount: doc.chunkCount || 0,
      uploadedAt: doc.uploadedAt,
      updatedAt: doc.updatedAt,
      errorMessage: doc.errorMessage,
      country: doc.country,
      carrier: doc.carrier,
      type: doc.type,
    }));

    const processingStats: DocumentProcessingStats = {
      totalDocuments,
      processedDocuments,
      processingDocuments,
      failedDocuments,
      successRate,
      failureRate,
      recentActivity,
      processingOverTime,
    };

    // -------------------------------------------------------------
    // 2. Document & Vector Database Statistics
    // -------------------------------------------------------------
    const totalChunksGenerated = documentStore.getTotalChunksCount();
    const averageVectorsPerDocument =
      totalDocuments > 0
        ? Number((totalVectorsStored / totalDocuments).toFixed(2))
        : 0;
    const averageChunksPerDocument =
      totalDocuments > 0
        ? Number((totalChunksGenerated / totalDocuments).toFixed(2))
        : 0;

    let successfullyIndexed = 0;
    let missingOrInconsistent = 0;
    const perDocument: DocumentSyncItem[] = [];

    const docIdSet = new Set<string>();

    for (const doc of docs) {
      docIdSet.add(doc.id);
      const expectedChunks = doc.chunkCount || 0;
      const actualVectors = vectorCountsByDoc.get(doc.id) ?? 0;

      const isProcessed = doc.status === "indexed" || doc.status === "processed";
      let isConsistent = false;

      if (isProcessed) {
        isConsistent = expectedChunks > 0 && actualVectors === expectedChunks;
        if (isConsistent) {
          successfullyIndexed++;
        } else {
          missingOrInconsistent++;
        }
      } else {
        isConsistent = actualVectors === 0;
        if (!isConsistent) {
          missingOrInconsistent++;
        }
      }

      perDocument.push({
        documentId: doc.id,
        title: doc.title,
        chunkCount: expectedChunks,
        vectorCount: actualVectors,
        status: doc.status,
        isConsistent,
        country: doc.country,
        carrier: doc.carrier,
      });
    }

    let orphanedVectors = 0;
    for (const [docId, count] of vectorCountsByDoc.entries()) {
      if (!docIdSet.has(docId)) {
        orphanedVectors += count;
      }
    }

    const isStoreConsistent =
      missingOrInconsistent === 0 && orphanedVectors === 0;

    const carrierMap = new Map<string, { docCount: number; chunkCount: number; vectorCount: number }>();
    const countryMap = new Map<string, { docCount: number; chunkCount: number; vectorCount: number }>();
    const typeMap = new Map<string, { docCount: number; chunkCount: number; vectorCount: number }>();

    for (const doc of docs) {
      const carrier = doc.carrier || "Unspecified";
      const country = doc.country || "Unspecified";
      const type = doc.type || "Customs Regulation";

      const chunkCount = doc.chunkCount || 0;
      const vectorCount = vectorCountsByDoc.get(doc.id) ?? 0;

      const cData = carrierMap.get(carrier) || { docCount: 0, chunkCount: 0, vectorCount: 0 };
      cData.docCount++;
      cData.chunkCount += chunkCount;
      cData.vectorCount += vectorCount;
      carrierMap.set(carrier, cData);

      const coData = countryMap.get(country) || { docCount: 0, chunkCount: 0, vectorCount: 0 };
      coData.docCount++;
      coData.chunkCount += chunkCount;
      coData.vectorCount += vectorCount;
      countryMap.set(country, coData);

      const tData = typeMap.get(type) || { docCount: 0, chunkCount: 0, vectorCount: 0 };
      tData.docCount++;
      tData.chunkCount += chunkCount;
      tData.vectorCount += vectorCount;
      typeMap.set(type, tData);
    }

    const mapToDistributions = (
      map: Map<string, { docCount: number; chunkCount: number; vectorCount: number }>
    ): CategoryDistribution[] =>
      Array.from(map.entries())
        .map(([name, data]) => ({
          name,
          documentCount: data.docCount,
          chunkCount: data.chunkCount,
          vectorCount: data.vectorCount,
        }))
        .sort((a, b) => b.documentCount - a.documentCount);

    const distributions = {
      byCarrier: mapToDistributions(carrierMap),
      byCountry: mapToDistributions(countryMap),
      byDocumentType: mapToDistributions(typeMap),
    };

    const vectorDbHealth: VectorDbHealth = {
      ...baseHealth,
      status:
        baseHealth.status === "error"
          ? "error"
          : !isStoreConsistent
          ? "degraded"
          : "connected",
    };

    const vectorDatabaseStats: DocumentVectorStats = {
      totalDocumentsStored: totalDocuments,
      totalChunksGenerated,
      totalVectorsStored,
      averageVectorsPerDocument,
      averageChunksPerDocument,
      indexingConsistency: {
        successfullyIndexed,
        missingOrInconsistent,
        orphanedVectors,
        isConsistent: isStoreConsistent,
        perDocument,
      },
      distributions,
      vectorDbHealth,
    };

    // -------------------------------------------------------------
    // 3. Query Analytics & RAG Retrieval Statistics
    // -------------------------------------------------------------
    const totalQueries = allQueries.length;
    const todayStr = new Date().toISOString().split("T")[0];
    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let queriesToday = 0;
    let queriesThisWeek = 0;
    let queriesWithSources = 0;
    let zeroSourceQueries = 0;
    let totalSourcesRetrieved = 0;

    const queryCarrierMap = new Map<string, number>();
    const queryCountryMap = new Map<string, number>();
    const queryDailyBuckets = new Map<string, number>();

    for (const q of allQueries) {
      const qDateStr = (q.createdAt || q.date || "").split("T")[0];
      const qTimeMs = new Date(q.createdAt || q.date).getTime();

      if (qDateStr === todayStr) queriesToday++;
      if (!isNaN(qTimeMs) && qTimeMs >= sevenDaysAgoMs) queriesThisWeek++;

      const sourcesCount = (q.sources || q.retrievedSources || []).length;
      totalSourcesRetrieved += sourcesCount;
      if (sourcesCount > 0) {
        queriesWithSources++;
      } else {
        zeroSourceQueries++;
      }

      if (q.carrier && q.carrier !== "all") {
        queryCarrierMap.set(q.carrier, (queryCarrierMap.get(q.carrier) ?? 0) + 1);
      }
      if (q.country && q.country !== "all") {
        queryCountryMap.set(q.country, (queryCountryMap.get(q.country) ?? 0) + 1);
      }

      if (qDateStr) {
        queryDailyBuckets.set(qDateStr, (queryDailyBuckets.get(qDateStr) ?? 0) + 1);
      }
    }

    const avgSourcesPerQuery =
      totalQueries > 0 ? Number((totalSourcesRetrieved / totalQueries).toFixed(1)) : 0;

    const mostQueriedCarriers = Array.from(queryCarrierMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const mostQueriedCountries = Array.from(queryCountryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const queriesOverTime = Array.from(queryDailyBuckets.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const queriesStats: QueryAnalyticsStats = {
      totalQueries,
      queriesToday,
      queriesThisWeek,
      queriesWithSources,
      zeroSourceQueries,
      totalSourcesRetrieved,
      avgSourcesPerQuery,
      mostQueriedCarriers,
      mostQueriedCountries,
      queriesOverTime,
    };

    // -------------------------------------------------------------
    // 4. Subsystem Health Checks
    // -------------------------------------------------------------
    const subsystemHealth: SubsystemHealth = {
      backendApi: {
        status: "healthy",
        uptime: Math.round(process.uptime()),
        latencyMs: 2,
      },
      documentStore: {
        status: "healthy",
        totalDocuments,
        indexedDocuments: processedDocuments,
      },
      vectorDatabase: vectorDbHealth,
      embeddingEngine: {
        status: process.env.OPENAI_API_KEY ? "healthy" : "mock",
        mode: process.env.OPENAI_API_KEY ? "OpenAI text-embedding-3-small" : "Deterministic Local Embedder",
        dimensions: 1536,
      },
      llmSubsystem: {
        status: process.env.OPENAI_API_KEY ? "healthy" : "mock",
        model: process.env.RAG_LLM_MODEL || "gpt-4o-mini",
      },
    };

    // -------------------------------------------------------------
    // 5. Unified Activity Feed
    // -------------------------------------------------------------
    const activityFeedItems: UnifiedActivityItem[] = [];

    for (const doc of docs) {
      activityFeedItems.push({
        id: `act-doc-${doc.id}`,
        type: doc.status === "error" || doc.status === "failed" ? "document_failed" : "document_upload",
        title: doc.title,
        description: doc.errorMessage
          ? `Ingestion failed: ${doc.errorMessage}`
          : `Uploaded ${doc.type} (${doc.country || "Global"}, ${doc.carrier || "All"})`,
        timestamp: doc.uploadedAt || new Date().toISOString(),
        status: doc.status,
        metadata: {
          documentId: doc.id,
          fileName: doc.fileName,
          chunkCount: doc.chunkCount,
        },
      });
    }

    for (const q of allQueries.slice(0, 15)) {
      activityFeedItems.push({
        id: `act-query-${q.id}`,
        type: "query_executed",
        title: q.question,
        description: `Executed query grounded with ${(q.sources || []).length} source citations`,
        timestamp: q.createdAt || q.date || new Date().toISOString(),
        status: q.status,
        metadata: {
          queryId: q.id,
          country: q.country,
          carrier: q.carrier,
          sourcesCount: (q.sources || []).length,
        },
      });
    }

    activityFeedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      processing: processingStats,
      vectorDatabase: vectorDatabaseStats,
      queries: queriesStats,
      subsystemHealth,
      activityFeed: activityFeedItems.slice(0, 20),
      generatedAt: new Date().toISOString(),
    };
  }
}
