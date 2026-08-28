import { RetrievalConfig, EmbeddingConfig } from "../../config/rag.config";
import { DocumentChunk } from "../../types/document";
import {
  RetrievalFilters,
  RetrievalParameters,
  RetrievalQuery,
  RetrievalResponse,
  RetrievedChunk,
} from "../../types/retrieval";
import { EmbeddingClient } from "../document/embedding";
import { generateQueryEmbedding } from "../query/queryEmbedding";
import { getDefaultVectorStore, VectorStore } from "./vectorStore";

function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function validateQueryVector(vector: number[]): void {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("Query vector must be a non-empty array of numbers");
  }
  if (vector.some((val) => !Number.isFinite(val))) {
    throw new Error("Query vector contains non-finite numbers");
  }
}

function resolveTopK(requestedTopK?: number): number {
  if (typeof requestedTopK !== "number" || isNaN(requestedTopK)) {
    return RetrievalConfig.defaultTopK;
  }
  const min = RetrievalConfig.minTopK;
  const max = RetrievalConfig.maxTopK;
  return Math.max(min, Math.min(max, Math.floor(requestedTopK)));
}

/**
 * Retrieves the top-K most relevant document chunks for a given query vector,
 * applying optional metadata filters and similarity thresholds.
 *
 * @param queryVector - Dense vector representing the user query
 * @param filters - Optional metadata filters (e.g., country, carrier, documentType, dateRange)
 * @param topK - Maximum number of chunks to retrieve (bounded by config)
 * @param vectorStore - Vector database store instance (defaults to shared store)
 * @returns Array of retrieved chunks ranked by semantic relevance
 */
export async function retrieveRelevantChunks(
  queryVector: number[],
  filters?: RetrievalFilters,
  topK?: number,
  vectorStore: VectorStore = getDefaultVectorStore()
): Promise<RetrievedChunk[]> {
  validateQueryVector(queryVector);
  const boundedTopK = resolveTopK(topK);

  const chunks = await vectorStore.search(queryVector, {
    topK: boundedTopK,
    filters,
    similarityThreshold: RetrievalConfig.similarityThreshold,
  });

  return chunks;
}

export interface RetrievalExecutionOptions {
  embeddingClient?: EmbeddingClient;
  vectorStore?: VectorStore;
  correlationId?: string;
}

/**
 * Executes an end-to-end retrieval flow:
 * 1. Takes a text query and optional filters/parameters
 * 2. Generates query vector embedding
 * 3. Applies metadata filtering and searches vector store
 * 4. Produces a comprehensive RetrievalResponse with metrics
 */
export async function retrieveForQuery(
  query: string | RetrievalQuery,
  options: RetrievalExecutionOptions = {}
): Promise<RetrievalResponse> {
  const startTime = Date.now();
  const correlationId =
    (typeof query === "object" && query.correlationId) ||
    options.correlationId ||
    generateCorrelationId();

  const queryString = typeof query === "string" ? query : query.question;
  const filters = typeof query === "object" ? query.filters : undefined;
  const parameters = typeof query === "object" ? query.parameters : undefined;

  const vectorStore = options.vectorStore || getDefaultVectorStore();

  try {
    const totalChunksAvailable = await vectorStore.count();

    const filterStartTime = Date.now();
    const totalChunksSearched = await vectorStore.countFiltered(filters);
    const filteringTimeMs = Date.now() - filterStartTime;

    // Generate query embedding
    const queryVector = await generateQueryEmbedding(queryString, options.embeddingClient);

    // Vector similarity search
    const vectorSearchStartTime = Date.now();
    const boundedTopK = resolveTopK(parameters?.topK);
    const similarityThreshold =
      parameters?.similarityThreshold !== undefined
        ? parameters.similarityThreshold
        : RetrievalConfig.similarityThreshold;

    const retrievedChunks = await vectorStore.search(queryVector, {
      topK: boundedTopK,
      filters,
      similarityThreshold,
    });
    const vectorSearchTimeMs = Date.now() - vectorSearchStartTime;

    const formatStartTime = Date.now();

    // Process chunk contents if includeContent is false
    const formattedChunks: RetrievedChunk[] = retrievedChunks.map((chunk) => {
      if (parameters?.includeContent === false) {
        return { ...chunk, content: "" };
      }
      return chunk;
    });

    const scores = formattedChunks.map((c) => c.relevanceScore);
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, val) => sum + val, 0) / scores.length : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    const formattingTimeMs = Date.now() - formatStartTime;
    const totalTimeMs = Date.now() - startTime;

    const warnings: string[] = [];
    if (totalChunksSearched === 0 && totalChunksAvailable > 0) {
      warnings.push("No chunks matched the applied metadata filters.");
    } else if (formattedChunks.length === 0 && totalChunksSearched > 0) {
      warnings.push("No chunks met the similarity threshold requirement.");
    }

    return {
      correlationId,
      query: queryString,
      appliedFilters: filters,
      retrievedChunks: formattedChunks,
      totalChunksAvailable,
      totalChunksSearched,
      retrievedChunksCount: formattedChunks.length,
      averageRelevanceScore: averageScore,
      minRelevanceScore: minScore,
      maxRelevanceScore: maxScore,
      performance: {
        filteringTimeMs,
        vectorSearchTimeMs,
        formattingTimeMs,
        totalTimeMs,
      },
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        embeddingModel: EmbeddingConfig.model,
        embeddingDimensions: queryVector.length,
        retrievalDate: new Date().toISOString(),
      },
    };
  } catch (error) {
    const totalTimeMs = Date.now() - startTime;
    return {
      correlationId,
      query: queryString,
      appliedFilters: filters,
      retrievedChunks: [],
      totalChunksAvailable: 0,
      totalChunksSearched: 0,
      retrievedChunksCount: 0,
      averageRelevanceScore: 0,
      minRelevanceScore: 0,
      maxRelevanceScore: 0,
      performance: {
        filteringTimeMs: 0,
        vectorSearchTimeMs: 0,
        formattingTimeMs: 0,
        totalTimeMs,
      },
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        embeddingModel: EmbeddingConfig.model,
        retrievalDate: new Date().toISOString(),
      },
    };
  }
}
