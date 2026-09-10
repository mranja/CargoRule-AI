import { cosineSimilarity } from "../document/embedding";
import { DocumentChunk, DocumentMetadata, Embedding } from "../../types/document";
import { RetrievalFilters, RetrievedChunk } from "../../types/retrieval";
import { normalizeCountry, normalizeCountryFilters } from "../../utils/country";
import { normalizeCarrier, normalizeCarrierFilters } from "../../utils/carrier";

export interface VectorStoreSearchOptions {
  topK?: number;
  filters?: RetrievalFilters;
  similarityThreshold?: number | null;
}

export interface VectorStoreRecord {
  chunk: DocumentChunk;
  vector: number[];
}

export interface VectorDbHealth {
  status: "connected" | "degraded" | "error";
  latencyMs: number;
  totalVectors: number;
  lastChecked: string;
}

export interface VectorStore {
  upsert(chunks: DocumentChunk[], embeddings: Embedding[]): Promise<void>;
  search(queryVector: number[], options?: VectorStoreSearchOptions): Promise<RetrievedChunk[]>;
  count(): Promise<number>;
  countFiltered(filters?: RetrievalFilters): Promise<number>;
  updateMetadataByDocumentId(documentId: string, metadata: Partial<DocumentMetadata>): Promise<number>;
  deleteByDocumentId(documentId: string): Promise<number>;
  clear(): Promise<void>;
  getVectorCountsByDocumentId(): Promise<Map<string, number>>;
  checkHealth(): Promise<VectorDbHealth>;
}

/**
 * Checks if a chunk's metadata matches the specified retrieval filters.
 */
export function matchesFilters(
  metadata: DocumentMetadata | undefined,
  filters?: RetrievalFilters
): boolean {
  if (!filters) {
    return true;
  }

  if (!metadata) {
    return false;
  }

  // Country filter (normalized comparison)
  if (filters.country && filters.country.length > 0) {
    const filterCountries = normalizeCountryFilters(filters.country);
    if (filterCountries && filterCountries.length > 0) {
      const chunkCountry = normalizeCountry(metadata.country);
      if (!chunkCountry || !filterCountries.includes(chunkCountry)) {
        return false;
      }
    }
  }

  // Carrier filter (normalized comparison)
  if (filters.carrier && filters.carrier.length > 0) {
    const filterCarriers = normalizeCarrierFilters(filters.carrier);
    if (filterCarriers && filterCarriers.length > 0) {
      const chunkCarrier = normalizeCarrier(metadata.carrier);
      if (!chunkCarrier || !filterCarriers.includes(chunkCarrier)) {
        return false;
      }
    }
  }

  // Document Type filter
  if (filters.documentType && filters.documentType.length > 0) {
    const chunkDocType = (metadata.documentType || "").trim().toLowerCase();
    const filterDocTypes = filters.documentType.map((dt) => dt.trim().toLowerCase());
    if (!chunkDocType || !filterDocTypes.includes(chunkDocType)) {
      return false;
    }
  }

  // Version filter
  if (filters.version && filters.version.length > 0) {
    const chunkVersion = (metadata.version || "").trim();
    if (!chunkVersion || !filters.version.includes(chunkVersion)) {
      return false;
    }
  }

  // Date Range filter (effectiveDate in ISO 8601, e.g. YYYY-MM-DD)
  if (filters.dateRange) {
    const effectiveDate = metadata.effectiveDate ? new Date(metadata.effectiveDate).getTime() : NaN;
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from).getTime();
      if (!isNaN(effectiveDate) && !isNaN(fromDate) && effectiveDate < fromDate) {
        return false;
      }
    }
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to).getTime();
      if (!isNaN(effectiveDate) && !isNaN(toDate) && effectiveDate > toDate) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates an in-memory vector store supporting exact cosine similarity search and metadata filtering.
 */
export function createInMemoryVectorStore(initialRecords: VectorStoreRecord[] = []): VectorStore {
  const records = new Map<string, VectorStoreRecord>();

  for (const record of initialRecords) {
    records.set(record.chunk.id, record);
  }

  return {
    async upsert(chunks: DocumentChunk[], embeddings: Embedding[]): Promise<void> {
      if (chunks.length !== embeddings.length) {
        throw new Error(
          `Chunk count (${chunks.length}) and embedding count (${embeddings.length}) must match`
        );
      }

      for (let i = 0; i < chunks.length; i += 1) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        if (chunk.id !== embedding.chunkId) {
          throw new Error(
            `Mismatched chunkId at index ${i}: chunk.id=${chunk.id}, embedding.chunkId=${embedding.chunkId}`
          );
        }

        records.set(chunk.id, {
          chunk,
          vector: embedding.vector,
        });
      }
    },

    async search(
      queryVector: number[],
      options: VectorStoreSearchOptions = {}
    ): Promise<RetrievedChunk[]> {
      const { topK = 5, filters, similarityThreshold = null } = options;

      const matched: Array<{ chunk: DocumentChunk; score: number }> = [];

      for (const record of records.values()) {
        if (!matchesFilters(record.chunk.metadata, filters)) {
          continue;
        }

        const score = cosineSimilarity(queryVector, record.vector);

        if (similarityThreshold !== null && similarityThreshold !== undefined) {
          if (score < similarityThreshold) {
            continue;
          }
        }

        matched.push({ chunk: record.chunk, score });
      }

      // Sort by similarity score descending
      matched.sort((a, b) => b.score - a.score);

      // Take top-K results and format as RetrievedChunk
      const topResults = matched.slice(0, topK);

      return topResults.map((item, index) => ({
        ...item.chunk,
        relevanceScore: item.score,
        rankingPosition: index + 1,
      }));
    },

    async count(): Promise<number> {
      return records.size;
    },

    async countFiltered(filters?: RetrievalFilters): Promise<number> {
      if (!filters) {
        return records.size;
      }
      let count = 0;
      for (const record of records.values()) {
        if (matchesFilters(record.chunk.metadata, filters)) {
          count += 1;
        }
      }
      return count;
    },

    async updateMetadataByDocumentId(
      documentId: string,
      metadata: Partial<DocumentMetadata>
    ): Promise<number> {
      let count = 0;
      for (const record of records.values()) {
        if (record.chunk.documentId === documentId) {
          record.chunk.metadata = {
            ...record.chunk.metadata,
            ...metadata,
          };
          if (metadata.documentName) {
            record.chunk.metadata.documentName = metadata.documentName;
          }
          count += 1;
        }
      }
      return count;
    },

    async deleteByDocumentId(documentId: string): Promise<number> {
      let count = 0;
      for (const [id, record] of records.entries()) {
        if (record.chunk.documentId === documentId) {
          records.delete(id);
          count += 1;
        }
      }
      return count;
    },

    async clear(): Promise<void> {
      records.clear();
    },

    async getVectorCountsByDocumentId(): Promise<Map<string, number>> {
      const counts = new Map<string, number>();
      for (const record of records.values()) {
        const docId = record.chunk.documentId;
        counts.set(docId, (counts.get(docId) ?? 0) + 1);
      }
      return counts;
    },

    async checkHealth(): Promise<VectorDbHealth> {
      const startTime = Date.now();
      try {
        const total = records.size;
        const latencyMs = Math.max(0, Date.now() - startTime);
        return {
          status: "connected",
          latencyMs,
          totalVectors: total,
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: "error",
          latencyMs: Math.max(0, Date.now() - startTime),
          totalVectors: 0,
          lastChecked: new Date().toISOString(),
        };
      }
    },
  };
}

let defaultStoreInstance: VectorStore | null = null;

/**
 * Returns the shared vector store instance.
 */
export function getDefaultVectorStore(): VectorStore {
  if (!defaultStoreInstance) {
    defaultStoreInstance = createInMemoryVectorStore();
  }
  return defaultStoreInstance;
}
