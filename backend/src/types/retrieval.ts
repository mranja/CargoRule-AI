/**
 * RAG Retrieval Types
 *
 * TypeScript interfaces for retrieval requests and responses
 * in the CargoRule AI RAG system.
 */

import { DocumentChunk, DocumentMetadata } from "./document";

/**
 * Filter criteria for metadata-based retrieval filtering.
 *
 * These filters are applied BEFORE vector search to reduce the search space.
 */
export interface RetrievalFilters {
  /**
   * Country or region filter.
   *
   * Retrieve chunks applicable to specific countries.
   *
   * Examples:
   * - ["Germany"] - Only Germany
   * - ["Germany", "Austria"] - Germany or Austria
   * - ["EU"] - EU-wide policies
   * - null or undefined - No country filter (include all)
   */
  country?: string[];

  /**
   * Carrier filter.
   *
   * Retrieve chunks applicable to specific carriers.
   *
   * Examples:
   * - ["DHL"] - Only DHL
   * - ["DHL", "FedEx"] - DHL or FedEx
   * - null or undefined - No carrier filter (include all)
   */
  carrier?: string[];

  /**
   * Document type filter.
   *
   * Retrieve chunks from specific types of documents.
   *
   * Examples:
   * - ["Customs Regulation"] - Only regulations
   * - ["Shipping Policy", "Carrier Agreement"] - Policies or agreements
   * - null or undefined - No document type filter (include all)
   */
  documentType?: string[];

  /**
   * Effective date range filter.
   *
   * Retrieve chunks with policies effective within a date range.
   *
   * Examples:
   * - { from: null, to: "2026-08-18" } - Policies effective up to today
   * - { from: "2024-01-01", to: "2024-12-31" } - 2024 policies only
   * - { from: "2026-01-01", to: null } - Policies from 2026 onward
   * - null or undefined - No date filter (include all)
   */
  dateRange?: {
    from?: string;  // ISO 8601 date, e.g., "2024-01-01"
    to?: string;    // ISO 8601 date, e.g., "2024-12-31"
  };

  /**
   * Document version filter.
   *
   * Retrieve chunks from specific document versions.
   *
   * Examples:
   * - ["v2"] - Only version 2
   * - ["v1", "v2"] - Version 1 or 2
   * - null or undefined - All versions (typically latest only)
   */
  version?: string[];

  /**
   * Custom filters (for future extensibility).
   *
   * Allows implementation of additional metadata filters.
   */
  [key: string]: unknown;
}

/**
 * Parameters for controlling retrieval behavior.
 */
export interface RetrievalParameters {
  /**
   * Number of top chunks to retrieve.
   *
   * Range: typically 1-20
   * Default: 5
   *
   * Recommended: 5 (balances coverage vs. context window)
   *
   * Can be overridden per query but will be bounded by:
   * - Minimum Top-K (typically 1)
   * - Maximum Top-K (typically 20)
   */
  topK?: number;

  /**
   * Minimum similarity score threshold.
   *
   * Range: 0.0 to 1.0
   * - null or undefined: No threshold (retrieve top-K regardless)
   * - 0.5: Discard chunks with similarity < 0.5
   * - 0.7: Stricter filter
   *
   * Default: null (no threshold)
   *
   * Recommendation: Start with null, monitor for quality.
   */
  similarityThreshold?: number | null;

  /**
   * Whether to include relevance scores in the response.
   *
   * Default: true
   *
   * Useful for:
   * - Debugging retrieval quality
   * - Displaying confidence to users
   * - Evaluating retrieval performance
   */
  includeRelevanceScores?: boolean;

  /**
   * Whether to include full metadata in the response.
   *
   * Default: true
   */
  includeMetadata?: boolean;

  /**
   * Whether to include the full chunk content in the response.
   *
   * Default: true
   *
   * Set to false if you only need chunk IDs and metadata
   * (for efficiency in large-scale retrieval).
   */
  includeContent?: boolean;
}

/**
 * Retrieval query combining question, filters, and parameters.
 *
 * This is the primary input to the retrieval system.
 */
export interface RetrievalQuery {
  /**
   * The user's question or search query.
   *
   * This will be embedded and used for semantic similarity search.
   *
   * Example:
   * "What documents are needed to ship lithium batteries from India to Germany?"
   */
  question: string;

  /**
   * Metadata filters for reducing search space.
   *
   * Optional. If not provided, all documents are considered.
   */
  filters?: RetrievalFilters;

  /**
   * Retrieval parameters controlling behavior.
   *
   * Optional. If not provided, defaults are used.
   */
  parameters?: RetrievalParameters;

  /**
   * Correlation ID for tracking this retrieval request.
   *
   * Optional. Used for logging and debugging.
   * If not provided, a UUID will be generated.
   */
  correlationId?: string;

  /**
   * Timestamp when the query was created.
   *
   * Optional. Used for audit trails.
   * If not provided, current timestamp is used.
   */
  timestamp?: string;  // ISO 8601 datetime
}

/**
 * A retrieved document chunk.
 *
 * This represents a chunk of a document that was returned
 * by the retrieval system.
 */
export interface RetrievedChunk extends DocumentChunk {
  /**
   * Semantic similarity score between the query and this chunk.
   *
   * Range: 0.0 to 1.0
   * - 1.0: Perfect match
   * - 0.5: Moderate relevance
   * - 0.0: No relevance
   *
   * Used to:
   * - Rank chunks by relevance
   * - Assess retrieval quality
   * - Display confidence to users
   */
  relevanceScore: number;

  /**
   * Ranking position of this chunk in the results.
   *
   * Range: 1 to K (where K is the number of retrieved chunks)
   *
   * 1 = most relevant, K = least relevant
   */
  rankingPosition: number;

  /**
   * Explanation of why this chunk was retrieved.
   *
   * Optional. Useful for debugging and understanding retrieval behavior.
   *
   * Example:
   * "Matched on country='Germany' and keywords 'lithium battery'"
   */
  retrievalReason?: string;
}

/**
 * Response from the retrieval system.
 *
 * Contains retrieved chunks and metadata about the retrieval.
 */
export interface RetrievalResponse {
  /**
   * Correlation ID for tracking this retrieval.
   *
   * Can be used to correlate with logs and audit trails.
   */
  correlationId: string;

  /**
   * The original question/query.
   */
  query: string;

  /**
   * The filters that were applied.
   */
  appliedFilters?: RetrievalFilters;

  /**
   * The retrieved chunks, ordered by relevance.
   *
   * Each chunk includes:
   * - Content (text)
   * - Metadata (country, carrier, document type, etc.)
   * - Relevance score
   * - Ranking position
   */
  retrievedChunks: RetrievedChunk[];

  /**
   * Number of chunks that matched the filters (before vector search).
   *
   * Useful for understanding search space reduction.
   *
   * Example:
   * If there are 5000 total chunks, 100 match country filter,
   * and 5 are returned, then:
   * - totalChunksAvailable = 5000
   * - totalChunksSearched = 100
   * - retrievedChunksCount = 5
   */
  totalChunksAvailable: number;
  totalChunksSearched: number;

  /**
   * Number of chunks actually retrieved.
   *
   * Typically equals K unless there are fewer matching chunks.
   */
  retrievedChunksCount: number;

  /**
   * Average relevance score across retrieved chunks.
   *
   * Useful for assessing overall retrieval quality.
   *
   * Range: 0.0 to 1.0
   */
  averageRelevanceScore: number;

  /**
   * Minimum relevance score among retrieved chunks.
   *
   * The "worst" match in the top-K.
   */
  minRelevanceScore: number;

  /**
   * Maximum relevance score among retrieved chunks.
   *
   * The "best" match.
   */
  maxRelevanceScore: number;

  /**
   * Time taken to perform the retrieval (milliseconds).
   *
   * Breakdown:
   * - Filtering: time to apply metadata filters
   * - VectorSearch: time to search vectors
   * - Formatting: time to format response
   */
  performance: {
    filteringTimeMs: number;
    vectorSearchTimeMs: number;
    formattingTimeMs: number;
    totalTimeMs: number;
  };

  /**
   * Whether the retrieval was successful.
   *
   * true = chunks were retrieved successfully
   * false = retrieval failed (check error field)
   */
  success: boolean;

  /**
   * Error message if retrieval failed.
   *
   * Only populated if success === false.
   */
  error?: string;

  /**
   * Warnings about the retrieval quality.
   *
   * Examples:
   * - "No chunks found matching filters. Returning unfiltered results."
   * - "Low average relevance score (0.45). Consider refining the query."
   * - "Retrieved fewer chunks than requested (2 of 5)."
   */
  warnings?: string[];

  /**
   * Metadata about the retrieval system state.
   *
   * Useful for debugging and monitoring.
   */
  metadata?: {
    vectorDatabaseVersion?: string;
    embeddingModel?: string;
    embeddingDimensions?: number;
    retrievalDate?: string;  // ISO 8601
  };
}

/**
 * Retrieval result with context for LLM.
 *
 * This combines retrieved chunks into a formatted context
 * suitable for passing to an LLM for answer generation.
 */
export interface RetrievalContextForLLM {
  /**
   * Formatted context string for the LLM.
   *
   * Example:
   * ```
   * === RETRIEVED CONTEXT ===
   *
   * [1] Germany Customs Regulation (Section: Lithium Batteries, Page: 14)
   *     Content: ...
   *
   * [2] DHL Shipping Policy (Section: Restricted Items, Page: 8)
   *     Content: ...
   * ```
   */
  context: string;

  /**
   * Individual retrieved chunks (for reference and source tracking).
   */
  chunks: RetrievedChunk[];

  /**
   * Summary of sources used.
   *
   * Example:
   * "Retrieved 5 chunks from 3 documents:
   *  - Germany Customs Regulation (v2)
   *  - DHL Shipping Policy (v1)
   *  - India Export Requirements (v3)"
   */
  sourcesSummary: string;

  /**
   * List of sources that can be shown to users.
   *
   * Each source includes:
   * - Document name
   * - Section
   * - Page number
   * - Relevance score
   */
  sourcesList: Array<{
    documentName: string;
    section?: string;
    pageNumber?: number;
    relevanceScore: number;
  }>;

  /**
   * Estimated token count for the context.
   *
   * Useful for LLM context window management.
   *
   * Rough estimate: 1 token ≈ 4 characters
   */
  estimatedTokenCount: number;

  /**
   * Confidence score for the retrieval.
   *
   * Range: 0.0 to 1.0
   * - 1.0: Very confident (high average relevance)
   * - 0.5: Moderate confidence
   * - 0.0: Low confidence (no good matches)
   *
   * Calculated from:
   * - Average relevance score
   * - Number of retrieved chunks
   * - Quality of metadata matches
   */
  confidenceScore: number;

  /**
   * Recommendations for improving the answer.
   *
   * Examples:
   * - "Consider the date filter: some results are from outdated policies."
   * - "Multiple conflicting policies found. See all sources."
   * - "No results found for the specified carrier. Showing country-level policies."
   */
  recommendations?: string[];
}

/**
 * Feedback on retrieval and answer quality.
 *
 * Collected from users to improve retrieval and LLM performance.
 */
export interface RetrievalFeedback {
  /**
   * Correlation ID linking this feedback to a specific retrieval/answer.
   */
  correlationId: string;

  /**
   * User rating of the answer.
   *
   * Scale: 1-5
   * - 5: Excellent, exactly what I needed
   * - 4: Good, mostly helpful
   * - 3: OK, somewhat helpful
   * - 2: Poor, not very helpful
   * - 1: Useless, completely unhelpful
   */
  rating: 1 | 2 | 3 | 4 | 5;

  /**
   * Whether the answer was helpful.
   *
   * Simple binary feedback.
   */
  isHelpful?: boolean;

  /**
   * Text comment from the user.
   *
   * Examples:
   * - "Missing information about Indian export requirements"
   * - "Conflicting policies shown, need clarification"
   * - "Exactly what I needed, thank you!"
   */
  comment?: string;

  /**
   * Which retrieved chunks were actually used by the user.
   *
   * Chunk IDs can help identify which sources are most valuable.
   */
  usefulChunkIds?: string[];

  /**
   * Which retrieved chunks were not useful.
   */
  notUsefulChunkIds?: string[];

  /**
   * Timestamp of the feedback.
   */
  timestamp: string;  // ISO 8601

  /**
   * User ID (optional, for tracking individual users).
   */
  userId?: string;
}

/**
 * Batch retrieval query for retrieving for multiple questions at once.
 *
 * Useful for:
 * - Testing multiple scenarios
 * - Batch processing
 * - Evaluation
 */
export interface BatchRetrievalQuery {
  /**
   * Multiple retrieval queries to execute.
   */
  queries: Array<RetrievalQuery & { id: string }>;

  /**
   * Whether to execute queries in parallel or sequentially.
   *
   * Default: true (parallel for better performance)
   */
  parallel?: boolean;

  /**
   * Batch ID for tracking.
   */
  batchId?: string;
}

/**
 * Batch retrieval response.
 */
export interface BatchRetrievalResponse {
  /**
   * Batch ID for tracking.
   */
  batchId: string;

  /**
   * Responses for each query, keyed by query ID.
   */
  responses: Record<string, RetrievalResponse>;

  /**
   * Summary statistics across all queries.
   */
  summary: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageRetrievalTimeMs: number;
    averageRelevanceScore: number;
    totalChunksRetrieved: number;
  };

  /**
   * Overall execution time.
   */
  totalTimeMs: number;
}
