import { documentStore, DocumentRecord } from "../document/documentStore";
import { getDefaultVectorStore, VectorStore, VectorDbHealth } from "../retrieval/vectorStore";

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

export interface AdminDashboardStats {
  processing: DocumentProcessingStats;
  vectorDatabase: DocumentVectorStats;
  generatedAt: string;
}

export class AdminStatsService {
  /**
   * Generates comprehensive Admin Dashboard statistics using real data from
   * documentStore and vectorStore.
   */
  public static async getAdminDashboardStats(
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<AdminDashboardStats> {
    const docs = documentStore.getAllDocuments();
    const vectorCountsByDoc = await vectorStore.getVectorCountsByDocumentId();
    const totalVectorsStored = await vectorStore.count();
    const baseHealth = await vectorStore.checkHealth();

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

      // Daily bucket
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

    // Indexing Consistency Check
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
        // Must have vectors equal to chunks and > 0
        isConsistent = expectedChunks > 0 && actualVectors === expectedChunks;
        if (isConsistent) {
          successfullyIndexed++;
        } else {
          missingOrInconsistent++;
        }
      } else {
        // Unprocessed/failed documents should not leave hanging vectors
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

    // Check for orphaned vectors (vectors in store whose doc doesn't exist in documentStore)
    let orphanedVectors = 0;
    for (const [docId, count] of vectorCountsByDoc.entries()) {
      if (!docIdSet.has(docId)) {
        orphanedVectors += count;
      }
    }

    const isStoreConsistent =
      missingOrInconsistent === 0 && orphanedVectors === 0;

    // Distributions
    const carrierMap = new Map<
      string,
      { docCount: number; chunkCount: number; vectorCount: number }
    >();
    const countryMap = new Map<
      string,
      { docCount: number; chunkCount: number; vectorCount: number }
    >();
    const typeMap = new Map<
      string,
      { docCount: number; chunkCount: number; vectorCount: number }
    >();

    for (const doc of docs) {
      const carrier = doc.carrier || "Unspecified";
      const country = doc.country || "Unspecified";
      const type = doc.type || "Customs Regulation";

      const chunkCount = doc.chunkCount || 0;
      const vectorCount = vectorCountsByDoc.get(doc.id) ?? 0;

      // Carrier
      const cData = carrierMap.get(carrier) || {
        docCount: 0,
        chunkCount: 0,
        vectorCount: 0,
      };
      cData.docCount++;
      cData.chunkCount += chunkCount;
      cData.vectorCount += vectorCount;
      carrierMap.set(carrier, cData);

      // Country
      const coData = countryMap.get(country) || {
        docCount: 0,
        chunkCount: 0,
        vectorCount: 0,
      };
      coData.docCount++;
      coData.chunkCount += chunkCount;
      coData.vectorCount += vectorCount;
      countryMap.set(country, coData);

      // Type
      const tData = typeMap.get(type) || {
        docCount: 0,
        chunkCount: 0,
        vectorCount: 0,
      };
      tData.docCount++;
      tData.chunkCount += chunkCount;
      tData.vectorCount += vectorCount;
      typeMap.set(type, tData);
    }

    const mapToDistributions = (
      map: Map<
        string,
        { docCount: number; chunkCount: number; vectorCount: number }
      >
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

    return {
      processing: processingStats,
      vectorDatabase: vectorDatabaseStats,
      generatedAt: new Date().toISOString(),
    };
  }
}
