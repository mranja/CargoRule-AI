/**
 * RAG Configuration
 *
 * Central configuration for the Retrieval-Augmented Generation system.
 *
 * These parameters should be configurable via environment variables
 * in production, but are defined here with sensible defaults.
 */

/**
 * Embedding Configuration
 *
 * Controls how document chunks and queries are converted to vectors.
 */
export const EmbeddingConfig = {
  /**
   * Embedding model to use for all embeddings.
   *
   * CRITICAL: Must be consistent across all embeddings and queries.
   * Changing this requires re-embedding all documents.
   *
   * Recommended models:
   * - "text-embedding-3-small" (OpenAI, 1536 dimensions, recommended)
   * - "text-embedding-3-large" (OpenAI, 3072 dimensions, more expensive)
   * - "all-MiniLM-L6-v2" (Open-source, 384 dimensions)
   * - "all-mpnet-base-v2" (Open-source, 768 dimensions, more expensive)
   *
   * @default "text-embedding-3-small"
   */
  model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",

  /**
   * Number of dimensions in the embedding vector.
   *
   * Must match the selected model.
   *
   * - text-embedding-3-small: 1536
   * - text-embedding-3-large: 3072
   * - all-MiniLM-L6-v2: 384
   * - all-mpnet-base-v2: 768
   *
   * @default 1536
   */
  dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || "1536"),

  /**
   * API endpoint for embedding service.
   *
   * If using OpenAI's API, this should be the OpenAI API endpoint.
   * If using a self-hosted model, configure this to point to your service.
   *
   * @default OpenAI's default endpoint
   */
  apiEndpoint: process.env.EMBEDDING_API_ENDPOINT || "https://api.openai.com/v1/embeddings",

  /**
   * API key for the embedding service.
   *
   * NEVER hardcode this. Always load from environment variables.
   *
   * @required
   */
  apiKey: process.env.OPENAI_API_KEY,

  /**
   * Batch size for embedding API calls.
   *
   * The OpenAI API allows up to 2048 documents per request.
   * Larger batches are more efficient but use more memory.
   *
   * Recommended: 100-500 for balance.
   *
   * @default 100
   */
  batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || "100"),

  /**
   * Timeout for embedding API calls (milliseconds).
   *
   * @default 30000 (30 seconds)
   */
  timeoutMs: parseInt(process.env.EMBEDDING_TIMEOUT_MS || "30000"),
} as const;

/**
 * Chunking Configuration
 *
 * Controls how documents are split into chunks.
 */
export const ChunkingConfig = {
  /**
   * Target chunk size in tokens.
   *
   * CargoRule documents are complex and structured. Larger chunks
   * preserve more context but reduce the number of retrievable pieces.
   *
   * Recommended range: 400-1000 tokens
   *
   * Why 600?
   * - Small enough to be semantically coherent
   * - Large enough to contain complete thoughts
   * - Typically 1500-2400 characters
   *
   * @default 600
   */
  sizeTokens: parseInt(process.env.CHUNK_SIZE_TOKENS || "600"),

  /**
   * Overlap between consecutive chunks in tokens.
   *
   * Overlap helps with context preservation across chunk boundaries.
   * Recommended range: 50-200 tokens
   *
   * Why 75?
   * - Preserves context across boundaries
   * - Reduces the chance of splitting important information
   * - Roughly 10% of chunk size
   *
   * @default 75
   */
  overlapTokens: parseInt(process.env.CHUNK_OVERLAP_TOKENS || "75"),

  /**
   * Strategy for chunking documents.
   *
   * Options:
   * - "section-aware": Respect document structure (sections, paragraphs, lists)
   * - "sliding-window": Simple sliding window approach (less preferred)
   * - "semantic": Use semantic similarity to find natural breaks (advanced)
   *
   * CargoRule should use "section-aware" to preserve logistics document structure.
   *
   * @default "section-aware"
   */
  strategy: process.env.CHUNKING_STRATEGY as "section-aware" | "sliding-window" | "semantic" || "section-aware",

  /**
   * Whether to preserve original document structure.
   *
   * When true, each chunk includes its section heading for context.
   *
   * @default true
   */
  preserveHeadings: (process.env.CHUNK_PRESERVE_HEADINGS || "true") === "true",

  /**
   * Whether to preserve lists as complete units.
   *
   * When true, lists are not split across chunks.
   *
   * @default true
   */
  preserveLists: (process.env.CHUNK_PRESERVE_LISTS || "true") === "true",

  /**
   * Whether to preserve tables as complete units.
   *
   * When true, tables are not split across chunks.
   *
   * @default true
   */
  preserveTables: (process.env.CHUNK_PRESERVE_TABLES || "true") === "true",
} as const;

/**
 * Retrieval Configuration
 *
 * Controls how document chunks are retrieved in response to queries.
 */
export const RetrievalConfig = {
  /**
   * Default number of top chunks to retrieve.
   *
   * Recommended: 3-10 chunks
   *
   * Why 5?
   * - Provides sufficient context (~2500-3000 tokens)
   * - Balances coverage vs. focus
   * - Standard in production RAG systems
   * - Leaves room in LLM context window
   *
   * Can be overridden per query.
   *
   * @default 5
   */
  defaultTopK: parseInt(process.env.RETRIEVAL_DEFAULT_TOP_K || "5"),

  /**
   * Minimum number of chunks to retrieve.
   *
   * Even if user asks for K=1, retrieve at least this many.
   *
   * @default 1
   */
  minTopK: parseInt(process.env.RETRIEVAL_MIN_TOP_K || "1"),

  /**
   * Maximum number of chunks to retrieve.
   *
   * Prevent excessive context that might confuse the LLM or exceed token limits.
   *
   * @default 20
   */
  maxTopK: parseInt(process.env.RETRIEVAL_MAX_TOP_K || "20"),

  /**
   * Minimum similarity threshold for retrieved chunks.
   *
   * Chunks with similarity < this value are discarded.
   *
   * Range: 0.0 to 1.0
   * - null = no threshold (retrieve top-K regardless of score)
   * - 0.5 = moderate filter
   * - 0.7 = strict filter
   *
   * Recommended: null (no threshold) initially, monitor for quality.
   *
   * @default null
   */
  similarityThreshold: process.env.RETRIEVAL_SIMILARITY_THRESHOLD
    ? parseFloat(process.env.RETRIEVAL_SIMILARITY_THRESHOLD)
    : null,

  /**
   * Whether to include relevance scores in the response.
   *
   * Useful for debugging and quality assessment.
   *
   * @default true
   */
  includeRelevanceScores: (process.env.RETRIEVAL_INCLUDE_SCORES || "true") === "true",

  /**
   * Whether to include full metadata in the response.
   *
   * @default true
   */
  includeMetadata: (process.env.RETRIEVAL_INCLUDE_METADATA || "true") === "true",

  /**
   * Timeout for retrieval requests (milliseconds).
   *
   * @default 5000 (5 seconds)
   */
  timeoutMs: parseInt(process.env.RETRIEVAL_TIMEOUT_MS || "5000"),
} as const;

/**
 * Vector Database Configuration
 *
 * Connection and indexing settings for the vector database.
 */
export const VectorDatabaseConfig = {
  /**
   * Vector database provider.
   *
   * Options:
   * - "pinecone": Managed vector database
   * - "weaviate": Open-source vector database
   * - "milvus": Open-source vector database
   * - "qdrant": High-performance vector database
   * - "chroma": Lightweight embedded vector database
   *
   * @required
   */
  provider: process.env.VECTOR_DB_PROVIDER || "pinecone",

  /**
   * API endpoint for the vector database.
   *
   * Format depends on provider:
   * - Pinecone: "https://[index-name]-[project-id].svc.[environment].pinecone.io"
   * - Weaviate: "http://localhost:8080"
   * - Milvus: "localhost:19530"
   *
   * @required
   */
  apiEndpoint: process.env.VECTOR_DB_ENDPOINT,

  /**
   * API key or password for authentication.
   *
   * NEVER hardcode this. Always load from environment variables.
   *
   * @required
   */
  apiKey: process.env.VECTOR_DB_API_KEY,

  /**
   * Index or collection name to store chunks.
   *
   * @default "cargορule-chunks"
   */
  indexName: process.env.VECTOR_DB_INDEX_NAME || "cargorrule-chunks",

  /**
   * Distance metric for similarity search.
   *
   * Options:
   * - "cosine": Cosine similarity (recommended for most cases)
   * - "euclidean": Euclidean distance
   * - "dotproduct": Dot product similarity
   *
   * @default "cosine"
   */
  distanceMetric: (process.env.VECTOR_DB_DISTANCE_METRIC as "cosine" | "euclidean" | "dotproduct") || "cosine",

  /**
   * Timeout for vector database operations (milliseconds).
   *
   * @default 10000 (10 seconds)
   */
  timeoutMs: parseInt(process.env.VECTOR_DB_TIMEOUT_MS || "10000"),
} as const;

/**
 * LLM Configuration
 *
 * Settings for the OpenAI-compatible language model.
 */
export const LLMConfig = {
  /**
   * LLM model to use for answering questions.
   *
   * Recommended models:
   * - "gpt-4": Most capable, higher cost
   * - "gpt-4-turbo-preview": Good balance
   * - "gpt-3.5-turbo": Cheaper, adequate for many tasks
   *
   * @default "gpt-4"
   */
  model: process.env.LLM_MODEL || "gpt-4",

  /**
   * API endpoint for the LLM service.
   *
   * If using OpenAI, this is "https://api.openai.com/v1/chat/completions"
   * If using a compatible provider, configure this accordingly.
   *
   * @default OpenAI's default endpoint
   */
  apiEndpoint: process.env.LLM_API_ENDPOINT || "https://api.openai.com/v1/chat/completions",

  /**
   * API key for the LLM service.
   *
   * NEVER hardcode this. Always load from environment variables.
   *
   * @required
   */
  apiKey: process.env.OPENAI_API_KEY,

  /**
   * Temperature for LLM generation.
   *
   * Range: 0.0 to 2.0
   * - 0.0: Deterministic (same input always produces same output)
   * - 0.5: Balanced
   * - 1.0: Creative
   * - 2.0: Very random
   *
   * For factual answers about logistics, use low temperature.
   * CargoRule should NOT make up regulations, so we use low temperature.
   *
   * @default 0.2
   */
  temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.2"),

  /**
   * Maximum tokens to generate in the response.
   *
   * Typical logistics questions can be answered in 500-1000 tokens.
   *
   * @default 1000
   */
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "1000"),

  /**
   * Top-P (nucleus sampling) parameter.
   *
   * Range: 0.0 to 1.0
   * - 1.0: Consider all tokens
   * - 0.9: Consider top 90% probability mass
   * - 0.5: Consider top 50% probability mass
   *
   * For grounded RAG answers, use 1.0 (no filtering).
   *
   * @default 1.0
   */
  topP: parseFloat(process.env.LLM_TOP_P || "1.0"),

  /**
   * Timeout for LLM requests (milliseconds).
   *
   * @default 30000 (30 seconds)
   */
  timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || "30000"),

  /**
   * System prompt for the LLM.
   *
   * This prompt defines how the LLM should behave when answering
   * logistics questions using RAG context.
   *
   * @default See LLMConfig.defaultSystemPrompt
   */
  systemPrompt: process.env.LLM_SYSTEM_PROMPT || LLMConfig.defaultSystemPrompt,

  /**
   * Default system prompt for RAG.
   *
   * Defines:
   * - Answer only using provided context
   * - Cite sources
   * - Do not invent regulations
   * - Acknowledge limitations
   */
  defaultSystemPrompt: `You are a logistics compliance assistant for CargoRule AI.

Your role is to answer questions about customs regulations, shipping policies, 
and carrier agreements using ONLY the provided document context below.

STRICT RULES:

1. Answer using ONLY the retrieved context provided below.
2. Do NOT invent or assume customs regulations.
3. Do NOT rely on external knowledge about policies.
4. Do NOT make up carrier requirements.
5. If the retrieved context does NOT contain sufficient information to answer 
   the question, explicitly state:
   "I could not find sufficient information in the available documents 
    to determine the applicable requirement. Please consult [relevant document name] 
    or contact the compliance team."
6. Always cite your sources. Include document name, section, and page number.
7. If multiple policies conflict, acknowledge the conflict and present all 
   relevant policies.
8. Be concise but complete. Provide enough detail for operations teams to 
   make informed decisions.

OUTPUT FORMAT:

Start with a direct answer to the question.

Then, provide sources in this format:

Sources:
- [Document Name], Section: [Section Name], Page: [Page Number], Version: [Version]

If there are important caveats or limitations in the retrieved information, 
note them clearly.`,
} as const;

/**
 * Metadata Field Configuration
 *
 * Defines which metadata fields are supported and how they're used.
 */
export const MetadataConfig = {
  /**
   * Supported filter types.
   *
   * These correspond to metadata fields that can be used for filtering.
   */
  filterTypes: {
    country: {
      description: "Country or region",
      examples: ["Germany", "India", "USA", "EU", "Global"],
      type: "string" as const,
    },
    carrier: {
      description: "Shipping carrier name",
      examples: ["DHL", "FedEx", "UPS", "Amazon Logistics"],
      type: "string" as const,
    },
    documentType: {
      description: "Type or category of document",
      examples: [
        "Customs Regulation",
        "Shipping Policy",
        "Carrier Agreement",
        "Prohibited Items List",
        "Hazardous Materials",
      ],
      type: "string" as const,
    },
    effectiveDate: {
      description: "Date when policy becomes effective (ISO 8601)",
      examples: ["2026-01-01", "2024-06-15"],
      type: "date" as const,
    },
    version: {
      description: "Document version identifier",
      examples: ["v1", "v2", "2024-06-01"],
      type: "string" as const,
    },
  },

  /**
   * Required metadata fields for every chunk.
   *
   * These MUST be populated for every document chunk.
   */
  required: ["documentId", "documentName", "chunkIndex"],

  /**
   * Optional metadata fields.
   *
   * These SHOULD be populated when available.
   */
  optional: ["country", "carrier", "documentType", "section", "pageNumber", "effectiveDate", "version"],
} as const;

/**
 * RAG Pipeline Configuration
 *
 * High-level configuration for the complete RAG pipeline.
 */
export const RAGPipelineConfig = {
  /**
   * Enable/disable document caching.
   *
   * When enabled, recently uploaded documents are cached in memory
   * to speed up re-processing and re-indexing.
   *
   * @default true
   */
  enableDocumentCache: (process.env.RAG_ENABLE_DOCUMENT_CACHE || "true") === "true",

  /**
   * Document cache size (number of documents).
   *
   * @default 100
   */
  documentCacheSize: parseInt(process.env.RAG_DOCUMENT_CACHE_SIZE || "100"),

  /**
   * Enable/disable embedding caching.
   *
   * When enabled, embeddings are cached to avoid recomputing.
   *
   * @default true
   */
  enableEmbeddingCache: (process.env.RAG_ENABLE_EMBEDDING_CACHE || "true") === "true",

  /**
   * Embedding cache size (number of embeddings).
   *
   * @default 10000
   */
  embeddingCacheSize: parseInt(process.env.RAG_EMBEDDING_CACHE_SIZE || "10000"),

  /**
   * Enable/disable query logging.
   *
   * When enabled, all queries and retrieved chunks are logged for
   * analysis, evaluation, and debugging.
   *
   * @default true
   */
  enableQueryLogging: (process.env.RAG_ENABLE_QUERY_LOGGING || "true") === "true",

  /**
   * Log retention period (days).
   *
   * Queries older than this are archived or deleted.
   *
   * @default 90
   */
  logRetentionDays: parseInt(process.env.RAG_LOG_RETENTION_DAYS || "90"),

  /**
   * Enable/disable user feedback collection.
   *
   * When enabled, users can rate answers as helpful/unhelpful
   * for continuous improvement.
   *
   * @default true
   */
  enableUserFeedback: (process.env.RAG_ENABLE_USER_FEEDBACK || "true") === "true",
} as const;

/**
 * Export all configuration objects
 */
export const RAGConfig = {
  embedding: EmbeddingConfig,
  chunking: ChunkingConfig,
  retrieval: RetrievalConfig,
  vectorDatabase: VectorDatabaseConfig,
  llm: LLMConfig,
  metadata: MetadataConfig,
  pipeline: RAGPipelineConfig,
} as const;

export default RAGConfig;
