/**
 * Document Types
 *
 * This module defines TypeScript interfaces for documents, chunks, and embeddings
 * in the CargoRule AI RAG system.
 *
 * Document Flow:
 * 1. Document is uploaded and processed
 * 2. Text is extracted, cleaned, and chunked
 * 3. Each chunk is embedded and stored with metadata
 * 4. During query, embeddings are searched and chunks are retrieved
 */

/**
 * DocumentChunk represents a single chunk of a document.
 *
 * Chunks are created by splitting a document into semantically meaningful
 * segments, typically 500-800 tokens in size with 50-100 token overlap.
 *
 * Each chunk retains rich metadata to enable:
 * - Source attribution (linking answers back to original documents)
 * - Metadata filtering (searching by country, carrier, document type, etc.)
 * - Audit trails (compliance and verification)
 */
export interface DocumentChunk {
  /**
   * Unique identifier for this chunk.
   *
   * Format: "{documentId}_{chunkIndex}"
   * Example: "doc_001_chunk_7"
   *
   * Used as primary key for retrieval and deduplication.
   */
  id: string;

  /**
   * Reference to the parent document.
   *
   * Used to group chunks by document and enable document-level filtering.
   */
  documentId: string;

  /**
   * The actual text content of this chunk.
   *
   * Size: typically 1500-2400 characters
   * Contains approximately 500-800 tokens
   *
   * This is the text that will be:
   * - Embedded into a vector
   * - Retrieved for user queries
   * - Displayed to users as context
   */
  content: string;

  /**
   * Sequential index of this chunk within its document.
   *
   * Range: 0 to (total_chunks_in_document - 1)
   *
   * Used to:
   * - Reconstruct document order
   * - Reference specific chunks in audit logs
   * - Enable pagination through document chunks
   */
  chunkIndex: number;

  /**
   * Rich metadata for filtering, attribution, and context.
   *
   * These fields enable the system to:
   * - Filter by country, carrier, document type, or date
   * - Attribute answers to specific document sections
   * - Provide compliance audit trails
   */
  metadata: DocumentMetadata;
}

/**
 * DocumentMetadata contains structured information about a document chunk.
 *
 * These fields are used for:
 * 1. Pre-search filtering (reduce search space)
 * 2. Source attribution (show users where information comes from)
 * 3. Compliance validation (ensure policies are current and applicable)
 */
export interface DocumentMetadata {
  /**
   * Human-readable name of the document.
   *
   * Examples:
   * - "Germany Customs Regulation"
   * - "DHL Shipping Policy"
   * - "India Export Requirements"
   *
   * Displayed to users in source attribution.
   */
  documentName: string;

  /**
   * Country or region to which this document applies.
   *
   * Optional because some documents are global or multi-region.
   *
   * Examples: "Germany", "India", "United States", "EU"
   *
   * Used for metadata filtering:
   * Query: "Requirements for Germany" → filter where country = "Germany"
   */
  country?: string;

  /**
   * Carrier name if this document is carrier-specific.
   *
   * Optional because some documents apply to all carriers.
   *
   * Examples: "DHL", "FedEx", "Ups", "Amazon Logistics"
   *
   * Used for metadata filtering:
   * Query: "DHL shipping" → filter where carrier = "DHL"
   */
  carrier?: string;

  /**
   * Type or category of the document.
   *
   * Optional, but recommended for organizing large document sets.
   *
   * Examples:
   * - "Customs Regulation"
   * - "Shipping Policy"
   * - "Carrier Agreement"
   * - "Import/Export Requirement"
   * - "Restricted Items List"
   * - "Country-Specific Requirement"
   *
   * Used for filtering by document type or category.
   */
  documentType?: string;

  /**
   * Section or heading within the document.
   *
   * Examples:
   * - "Lithium Batteries"
   * - "Import Documentation"
   * - "Restricted Items"
   * - "Prohibited Goods"
   *
   * Helps users understand the context and topic of the retrieved chunk.
   */
  section?: string;

  /**
   * Original page number in the source document.
   *
   * Allows users to easily locate information in the actual document.
   *
   * Example: 14 (for page 14 of the PDF or Word document)
   */
  pageNumber?: number;

  /**
   * ISO 8601 date when this policy becomes effective.
   *
   * Format: "YYYY-MM-DD"
   * Example: "2026-01-01"
   *
   * Used to:
   * - Filter for policies effective on a specific date
   * - Show policy recency to users
   * - Distinguish between multiple versions of a policy
   *
   * Important: If multiple versions of a policy exist, only chunks from the
   * latest applicable version should be retrieved, unless the user asks
   * for historical information.
   */
  effectiveDate?: string;

  /**
   * Version identifier of the document.
   *
   * Format: "v1", "v2", etc. OR "2024-06-01" (date-based versioning)
   * Example: "v2" or "2026-01-01"
   *
   * Used to:
   * - Distinguish between revisions of the same document
   * - Show users which version of a policy applies
   * - Track policy changes over time
   */
  version?: string;
}

/**
 * Embedding represents a vectorized chunk ready for similarity search.
 *
 * Note: This type is provided for reference. In practice, the vector database
 * manages embeddings separately and typically does not require storing this
 * as part of the application document model.
 */
export interface Embedding {
  /**
   * Reference to the chunk this embedding represents.
   */
  chunkId: string;

  /**
   * The embedding vector (typically 1536 dimensions for text-embedding-3-small).
   *
   * Type is number[] to represent a dense vector.
   */
  vector: number[];

  /**
   * Model used to generate this embedding.
   *
   * Critical: All embeddings should use the same model.
   * Mixing models produces meaningless similarity scores.
   *
   * Example: "text-embedding-3-small"
   */
  embeddingModel: string;
}

/**
 * RetrievedChunk represents a document chunk that was returned by vector search.
 *
 * This type is used in query responses to show users the retrieved context.
 */
export interface RetrievedChunk extends DocumentChunk {
  /**
   * Relevance score from vector similarity search.
   *
   * Range: 0 to 1, where:
   * - 1.0 = perfect semantic match
   * - 0.5 = moderate relevance
   * - 0.0 = no relevance
   *
   * Used to:
   * - Rank chunks by relevance
   * - Filter out low-relevance results
   * - Show users confidence in the retrieval
   */
  relevanceScore: number;

  /**
   * Order in which this chunk was retrieved.
   *
   * Range: 1 to topK (typically 5)
   *
   * Used for presentation and understanding which results were most relevant.
   */
  rankingPosition: number;
}

/**
 * DocumentChunkRequest represents a request to create and store a new chunk.
 *
 * Used by the document processing pipeline.
 */
export interface DocumentChunkRequest {
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: DocumentMetadata;
}

export type SupportedDocumentType = "pdf" | "docx" | "txt";

export interface ExtractedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileType: SupportedDocumentType;
    pageCount?: number;
  };
}

/**
 * DocumentMetadata Example
 *
 * This is a structural example only. NOT real production data.
 *
 * ```json
 * {
 *   "documentId": "doc_001",
 *   "documentName": "Germany Customs Regulation",
 *   "country": "Germany",
 *   "carrier": "DHL",
 *   "documentType": "Customs Regulation",
 *   "section": "Lithium Batteries",
 *   "pageNumber": 14,
 *   "effectiveDate": "2026-01-01",
 *   "version": "v2",
 *   "chunkIndex": 7,
 *   "content": "Lithium batteries must be declared using Form LI-001..."
 * }
 * ```
 */
