# CargoRule AI: RAG Implementation Roadmap and Guide

## Executive Summary

CargoRule AI uses Retrieval-Augmented Generation (RAG) to provide accurate, source-backed answers to logistics and customs compliance questions. This document provides:

1. **Architecture overview** — How RAG works in CargoRule
2. **Implementation phases** — Staged rollout plan
3. **Component guide** — What each service should do
4. **Integration points** — How components connect
5. **Testing strategy** — How to validate the implementation
6. **Deployment checklist** — Pre-production verification

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                         │
│  - Upload documents                                             │
│  - Ask questions                                                │
│  - View answers with sources                                    │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
        ┌────────▼─────────┐          ┌──────────▼──────────┐
        │  Document API    │          │   Query API         │
        │  POST /upload    │          │   POST /query       │
        │  GET /documents  │          │   GET /history      │
        └────────┬─────────┘          └──────────┬──────────┘
                 │                                │
        ┌────────▼────────────────────────────────▼──────────┐
        │            Backend (Node.js/Express)               │
        │                                                    │
        │  ┌──────────────┐    ┌──────────────┐            │
        │  │ Document     │    │ Retrieval    │            │
        │  │ Ingestion    │    │ Service      │            │
        │  │              │    │              │            │
        │  │ - Upload     │    │ - Embed Q    │            │
        │  │ - Extract    │    │ - Filter     │            │
        │  │ - Clean      │    │ - Search     │            │
        │  │ - Chunk      │    │ - Rank       │            │
        │  │ - Embed D    │    │              │            │
        │  └──────┬───────┘    └──────┬───────┘            │
        │         │                   │                    │
        │  ┌──────▼──────────────────▼──────┐             │
        │  │   Vector Database Cache         │             │
        │  │   - Chunks                      │             │
        │  │   - Embeddings                  │             │
        │  │   - Metadata Indices            │             │
        │  └──────────┬─────────────────────┘             │
        │             │                                   │
        └─────────────┼───────────────────────────────────┘
                      │
        ┌─────────────▼─────────────────┐
        │   External Services           │
        │                               │
        │  ┌─────────────────────────┐ │
        │  │ Embedding Service       │ │
        │  │ (OpenAI Embeddings)     │ │
        │  └─────────────────────────┘ │
        │                               │
        │  ┌─────────────────────────┐ │
        │  │ Vector Database         │ │
        │  │ (Pinecone/Weaviate)     │ │
        │  └─────────────────────────┘ │
        │                               │
        │  ┌─────────────────────────┐ │
        │  │ LLM Service             │ │
        │  │ (OpenAI API)            │ │
        │  └─────────────────────────┘ │
        └───────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up core infrastructure and basic document processing.

**Deliverables:**

1. **Configuration Service** ✓
   - File: `backend/src/config/rag.config.ts`
   - Status: Complete
   - Load environment variables
   - Provide constants for all components

2. **Type Definitions** ✓
   - File: `backend/src/types/document.ts`
   - File: `backend/src/types/retrieval.ts`
   - Status: Complete
   - Document chunk interface
   - Retrieval query/response interfaces

3. **Documentation** ✓
   - File: `docs/rag-architecture.md`
   - File: `docs/embedding-workflow.md`
   - File: `docs/retrieval-strategy.md`
   - Status: Complete
   - Architecture overview
   - Data flow documentation
   - Strategy documentation

### Phase 2: Document Processing (Week 2-3)

**Goal:** Implement document upload and ingestion pipeline.

**Components to build:**

1. **Document Upload API**
   ```typescript
   // backend/src/routes/documents.ts
   POST /api/documents/upload
   - Accept file upload (PDF/DOCX/TXT)
   - Store in temporary location
   - Trigger ingestion pipeline
   - Return document ID
   ```

2. **Text Extraction Service**
   ```typescript
   // backend/src/services/extraction/textExtractor.ts
   - Extract text from PDF
   - Extract text from DOCX
   - Extract text from TXT
   - Preserve formatting (headings, lists, tables)
   - Handle errors gracefully
   ```

3. **Text Cleaning Service**
   ```typescript
   // backend/src/services/extraction/textCleaner.ts
   - Remove extra whitespace
   - Normalize encoding
   - Fix line breaks
   - Remove boilerplate
   - Preserve meaningful structure
   ```

4. **Document Ingestion Pipeline**
   ```typescript
   // backend/src/services/documents/ingestionPipeline.ts
   DocumentIngestionPipeline {
     upload(file) 
       → extract(file)
       → clean(text)
       → extractMetadata(text)
       → chunk(text)
       → embed(chunks)
       → store(chunks, embeddings)
   }
   ```

### Phase 3: Embedding and Storage (Week 3-4)

**Goal:** Integrate embedding service and vector database.

**Components to build:**

1. **Embedding Service**
   ```typescript
   // backend/src/services/embeddings/embeddingService.ts
   EmbeddingService {
     embedText(text: string): number[]
     embedBatch(texts: string[]): number[][]
     getModel(): string
   }
   ```

2. **Vector Database Connector**
   ```typescript
   // backend/src/services/vectorDb/vectorDbConnector.ts
   VectorDatabaseConnector {
     connect(): Promise<void>
     upsertChunks(chunks): Promise<void>
     search(vector, topK, filters): Promise<RetrievedChunk[]>
     deleteDocument(documentId): Promise<void>
   }
   ```

3. **Chunk Storage Service**
   ```typescript
   // backend/src/services/documents/chunkStorage.ts
   ChunkStorageService {
     storeChunks(chunks, embeddings): Promise<void>
     getChunk(chunkId): Promise<DocumentChunk>
     deleteDocument(documentId): Promise<void>
   }
   ```

### Phase 4: Retrieval (Week 4-5)

**Goal:** Implement query embedding and semantic search.

**Components to build:**

1. **Query Embedding Service**
   ```typescript
   // backend/src/services/retrieval/queryEmbeddingService.ts
   - Embed user questions
   - Use SAME model as document embeddings
   - Handle errors and timeouts
   ```

2. **Retrieval Service**
   ```typescript
   // backend/src/services/retrieval/retrievalService.ts
   RetrievalService {
     retrieve(query: RetrievalQuery): Promise<RetrievalResponse>
     - Extract filters from query
     - Apply metadata filters
     - Perform vector search
     - Rank by relevance
     - Format response
   }
   ```

3. **Retrieval API**
   ```typescript
   // backend/src/routes/retrieval.ts
   POST /api/retrieval/search
   - Accept retrieval query
   - Call retrieval service
   - Return retrieved chunks
   ```

### Phase 5: LLM Integration (Week 5-6)

**Goal:** Integrate with OpenAI API for answer generation.

**Components to build:**

1. **Context Constructor**
   ```typescript
   // backend/src/services/rag/contextConstructor.ts
   - Format retrieved chunks
   - Add metadata (page number, section, etc.)
   - Construct prompt for LLM
   - Estimate token count
   ```

2. **LLM Service**
   ```typescript
   // backend/src/services/llm/llmService.ts
   LLMService {
     generateAnswer(prompt, context): Promise<string>
     - Use OpenAI API
     - Apply system prompt
     - Handle errors and timeouts
     - Track token usage
   }
   ```

3. **RAG Service (Orchestrator)**
   ```typescript
   // backend/src/services/rag/ragService.ts
   RAGService {
     answer(question): Promise<Answer>
     1. Retrieve relevant chunks
     2. Construct context
     3. Generate LLM response
     4. Extract and format sources
     5. Return answer with sources
   }
   ```

4. **Query API**
   ```typescript
   // backend/src/routes/queries.ts
   POST /api/queries
   - Accept user question
   - Call RAG service
   - Return answer with sources
   ```

### Phase 6: Testing and Evaluation (Week 6-7)

**Goal:** Validate retrieval quality and LLM accuracy.

**Testing components:**

1. **Unit Tests**
   - Test chunking logic
   - Test embedding consistency
   - Test retrieval filtering
   - Test context construction

2. **Integration Tests**
   - Test full document ingestion pipeline
   - Test full query-to-answer pipeline
   - Test metadata filtering
   - Test error handling

3. **Evaluation Tests**
   - Retrieval evaluation (MRR, NDCG, Precision@K)
   - LLM answer quality assessment
   - Source attribution accuracy
   - Hallucination detection

### Phase 7: Production Hardening (Week 7-8)

**Goal:** Add monitoring, logging, and operational features.

**Components to build:**

1. **Logging and Monitoring**
   - Request/response logging
   - Performance metrics
   - Error tracking
   - API usage monitoring

2. **Caching Layer**
   - Document cache
   - Embedding cache
   - Query cache (optional)

3. **Rate Limiting**
   - API rate limits
   - Embedding service rate limits
   - Vector database rate limits

4. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Deployment guide
   - Troubleshooting guide
   - Operations manual

---

## Component Reference

### 1. Document Ingestion Pipeline

**Purpose:** Transform uploaded documents into indexed chunks.

**Input:** File upload (PDF, DOCX, TXT)

**Output:** Chunks stored in vector database with metadata

**Key Functions:**
```typescript
interface DocumentIngestionPipeline {
  // Parse file and extract text
  extract(file: File): Promise<string>;
  
  // Clean and normalize text
  clean(text: string): Promise<string>;
  
  // Extract metadata from document
  extractMetadata(text: string, fileName: string): Promise<DocumentMetadata>;
  
  // Split text into chunks
  chunk(text: string, metadata: DocumentMetadata): Promise<DocumentChunk[]>;
  
  // Generate embeddings for all chunks
  embedChunks(chunks: DocumentChunk[]): Promise<Embedding[]>;
  
  // Store chunks and embeddings
  store(chunks: DocumentChunk[], embeddings: Embedding[]): Promise<void>;
}
```

**Error Handling:**
- Invalid file format → Return error
- Extraction failure → Log and return error
- Embedding failure → Retry with exponential backoff
- Storage failure → Rollback transaction

### 2. Embedding Service

**Purpose:** Convert text to vectors for similarity search.

**Key Functions:**
```typescript
interface EmbeddingService {
  // Embed a single text
  embed(text: string): Promise<number[]>;
  
  // Embed multiple texts (batch)
  embedBatch(texts: string[]): Promise<number[][]>;
  
  // Get the embedding model name
  getModel(): string;
  
  // Verify model consistency
  verifyModel(expectedModel: string): Promise<boolean>;
}
```

**Critical Notes:**
- MUST use same model for all embeddings
- Query embeddings MUST use same model as document embeddings
- Cache embeddings to reduce API calls
- Monitor token usage and costs

### 3. Vector Database

**Purpose:** Store and search embeddings with metadata filtering.

**Key Operations:**
```typescript
interface VectorDatabaseConnector {
  // Connect to database
  connect(): Promise<void>;
  
  // Upsert (insert or update) chunks
  upsert(chunks: DocumentChunk[], embeddings: Embedding[]): Promise<void>;
  
  // Search with metadata filtering
  search(
    queryVector: number[],
    filters: RetrievalFilters,
    topK: number,
    threshold?: number
  ): Promise<RetrievedChunk[]>;
  
  // Delete all chunks from a document
  deleteDocument(documentId: string): Promise<void>;
  
  // List indexed documents
  listDocuments(): Promise<Document[]>;
}
```

**Indexing Strategy:**
- Index document vectors with HNSW (Hierarchical Navigable Small World)
- Index metadata fields separately for fast filtering
- Create indices on: country, carrier, documentType, effectiveDate
- Regularly rebuild indices for optimal performance

### 4. Retrieval Service

**Purpose:** Retrieve relevant chunks in response to queries.

**Key Functions:**
```typescript
interface RetrievalService {
  // Main retrieval endpoint
  retrieve(query: RetrievalQuery): Promise<RetrievalResponse>;
  
  // Step 1: Extract filters from question
  extractFilters(question: string): Promise<RetrievalFilters>;
  
  // Step 2: Embed the question
  embedQuestion(question: string): Promise<number[]>;
  
  // Step 3: Search vector database
  searchVectors(
    queryVector: number[],
    filters: RetrievalFilters,
    topK: number
  ): Promise<RetrievedChunk[]>;
  
  // Step 4: Rank and format results
  rankResults(chunks: RetrievedChunk[]): Promise<RetrievedChunk[]>;
}
```

**Filter Extraction (Heuristic Example):**
```typescript
// Question: "What documents for Germany using DHL?"
// Extracted filters:
{
  country: ["Germany"],
  carrier: ["DHL"]
}
```

**Search Process:**
1. Apply metadata filters (reduces search space)
2. Perform vector similarity search on filtered chunks
3. Sort by similarity score
4. Return top-K with scores
5. Add source metadata

### 5. Context Constructor

**Purpose:** Format retrieved chunks into context for LLM.

**Key Functions:**
```typescript
interface ContextConstructor {
  // Build context from retrieved chunks
  construct(chunks: RetrievedChunk[]): Promise<RetrievalContextForLLM>;
  
  // Format individual chunk
  formatChunk(chunk: RetrievedChunk): string;
  
  // Create sources list
  createSourcesList(chunks: RetrievedChunk[]): SourceInfo[];
  
  // Estimate token count
  estimateTokens(context: string): number;
}
```

**Context Format:**
```
=== RETRIEVED CONTEXT ===

[1] Document Name (Section: Name, Page: N)
    Country: X | Carrier: Y | Type: Z
    Effective: YYYY-MM-DD | Version: V
    Relevance Score: 0.XX
    
    Content:
    [Chunk text here]

[2] ...
```

### 6. LLM Service

**Purpose:** Generate answers using OpenAI API and RAG context.

**Key Functions:**
```typescript
interface LLMService {
  // Generate answer with context
  generateAnswer(
    question: string,
    context: string,
    systemPrompt?: string
  ): Promise<string>;
  
  // Stream answer (for UI)
  streamAnswer(
    question: string,
    context: string
  ): AsyncGenerator<string>;
  
  // Validate response quality
  validateResponse(response: string): boolean;
  
  // Extract sources from response
  extractSources(response: string): string[];
}
```

**System Prompt:**
See `LLMConfig.defaultSystemPrompt` in `backend/src/config/rag.config.ts`

**Key Constraints:**
- Use low temperature (0.2) for factual answers
- Forbid inventing regulations
- Require source citations
- Handle uncertain responses clearly

### 7. RAG Service (Orchestrator)

**Purpose:** Coordinate all components into end-to-end RAG pipeline.

**Key Functions:**
```typescript
interface RAGService {
  // Main entry point: Question to Answer
  answer(question: string, filters?: RetrievalFilters): Promise<RAGAnswer>;
  
  // Internal steps:
  // 1. Retrieve relevant chunks
  retrieve(question: string, filters?: RetrievalFilters): Promise<RetrievedChunk[]>;
  
  // 2. Construct context
  constructContext(chunks: RetrievedChunk[]): Promise<string>;
  
  // 3. Generate answer
  generateAnswer(question: string, context: string): Promise<string>;
  
  // 4. Format final response with sources
  formatResponse(answer: string, chunks: RetrievedChunk[]): Promise<RAGAnswer>;
}
```

**Response Type:**
```typescript
interface RAGAnswer {
  answer: string;           // Generated answer
  sources: SourceInfo[];    // Documents used
  confidence: number;       // 0-1 confidence score
  retrievedChunks: number;  // How many chunks were used
  processingTimeMs: number; // Total time
}
```

---

## API Endpoints

### Document Management

#### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

Body:
  file: File
  country?: string
  carrier?: string
  documentType?: string

Response:
  {
    documentId: string,
    documentName: string,
    status: "processing" | "completed" | "failed",
    chunkCount?: number,
    error?: string
  }
```

#### Get Document Status
```
GET /api/documents/:documentId

Response:
  {
    documentId: string,
    documentName: string,
    uploadedAt: string,
    status: "processing" | "completed" | "failed",
    chunkCount: number,
    metadata: {
      country?: string,
      carrier?: string,
      documentType?: string,
      effectiveDate?: string
    }
  }
```

#### List Documents
```
GET /api/documents?limit=10&offset=0

Response:
  {
    documents: Document[],
    total: number,
    limit: number,
    offset: number
  }
```

#### Delete Document
```
DELETE /api/documents/:documentId

Response:
  { success: boolean }
```

### Query and Retrieval

#### Retrieve Chunks
```
POST /api/retrieval/search

Body:
  {
    question: string,
    filters?: {
      country?: string[],
      carrier?: string[],
      documentType?: string[],
      dateRange?: { from?: string, to?: string }
    },
    topK?: number
  }

Response:
  {
    query: string,
    retrievedChunks: RetrievedChunk[],
    averageRelevanceScore: number,
    performance: { totalTimeMs: number, ... }
  }
```

#### Get RAG Answer
```
POST /api/queries

Body:
  {
    question: string,
    filters?: RetrievalFilters
  }

Response:
  {
    answer: string,
    sources: [
      {
        documentName: string,
        section: string,
        pageNumber: number,
        relevanceScore: number
      }
    ],
    confidence: number,
    retrievedChunks: number,
    processingTimeMs: number
  }
```

#### Get Query History
```
GET /api/queries?limit=10&offset=0

Response:
  {
    queries: Query[],
    total: number
  }
```

#### Submit Feedback
```
POST /api/queries/:queryId/feedback

Body:
  {
    rating: 1-5,
    helpful: boolean,
    comment?: string,
    usefulChunkIds?: string[]
  }

Response:
  { success: boolean }
```

---

## Testing Strategy

### Unit Tests

**Test embedding consistency:**
```typescript
describe("EmbeddingService", () => {
  it("should produce same embedding for same text", async () => {
    const service = new EmbeddingService();
    const text = "Lithium batteries require LI-001 form";
    const emb1 = await service.embed(text);
    const emb2 = await service.embed(text);
    expect(emb1).toEqual(emb2);
  });
});
```

**Test chunking:**
```typescript
describe("TextChunker", () => {
  it("should preserve headings", async () => {
    const text = "## Section\nContent here";
    const chunks = await chunker.chunk(text);
    expect(chunks[0].content).toContain("## Section");
  });
  
  it("should handle lists without splitting", async () => {
    const text = "Items:\n- Item 1\n- Item 2\n- Item 3";
    const chunks = await chunker.chunk(text);
    expect(chunks.length).toBe(1); // Should be one chunk
  });
});
```

### Integration Tests

**Test document ingestion pipeline:**
```typescript
describe("DocumentIngestionPipeline", () => {
  it("should ingest PDF and create searchable chunks", async () => {
    const file = fs.readFileSync("test-doc.pdf");
    const result = await pipeline.ingest(file, {
      country: "Germany",
      documentType: "Customs Regulation"
    });
    
    expect(result.chunkCount).toBeGreaterThan(0);
    
    // Verify chunks are searchable
    const retrieved = await retrieval.retrieve({
      question: "lithium battery",
      filters: { country: ["Germany"] }
    });
    expect(retrieved.retrievedChunks.length).toBeGreaterThan(0);
  });
});
```

**Test retrieval with metadata filters:**
```typescript
describe("RetrievalService", () => {
  it("should filter by country and carrier", async () => {
    const response = await retrieval.retrieve({
      question: "shipping requirements",
      filters: {
        country: ["Germany"],
        carrier: ["DHL"]
      }
    });
    
    // All retrieved chunks should match filters
    response.retrievedChunks.forEach(chunk => {
      expect(chunk.metadata.country).toBe("Germany");
      expect(chunk.metadata.carrier).toBe("DHL");
    });
  });
});
```

### Evaluation Tests

**Retrieval evaluation:**
```typescript
describe("RetrievalQuality", () => {
  const testQueries = [
    {
      question: "Lithium battery shipping from India to Germany",
      shouldContain: ["doc_001_chunk_0", "doc_002_chunk_5"]
    }
  ];
  
  it("should retrieve expected chunks", async () => {
    for (const test of testQueries) {
      const response = await retrieval.retrieve({
        question: test.question
      });
      
      const retrievedIds = response.retrievedChunks.map(c => c.id);
      test.shouldContain.forEach(id => {
        expect(retrievedIds).toContain(id);
      });
    }
  });
});
```

---

## Deployment Checklist

### Pre-Deployment Verification

- [ ] All environment variables configured
- [ ] API keys valid and have sufficient quotas
- [ ] Vector database created and indexed
- [ ] LLM API accessible and tested
- [ ] Embedding model consistent across all services
- [ ] All tests passing
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring dashboards set up

### Production Configuration

```bash
# Verify configurations before deploying
NODE_ENV=production
LLM_TEMPERATURE=0.1          # Lower for production
RAG_ENABLE_QUERY_LOGGING=true
RETRIEVAL_TIMEOUT_MS=5000
LLM_TIMEOUT_MS=30000
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE_TOKENS=600
RETRIEVAL_DEFAULT_TOP_K=5
```

### Monitoring and Alerting

**Metrics to monitor:**
- API response times
- Embedding service latency
- Vector database query performance
- LLM API errors and rate limits
- Retrieval quality metrics
- User feedback scores

**Alerting rules:**
- Response time > 10 seconds
- Error rate > 1%
- Vector DB latency > 1 second
- LLM service unavailable
- Average relevance score < 0.5

---

## References

- [docs/rag-architecture.md](./rag-architecture.md) — Complete RAG architecture
- [docs/embedding-workflow.md](./embedding-workflow.md) — Detailed data flows
- [docs/retrieval-strategy.md](./retrieval-strategy.md) — Retrieval implementation
- [backend/src/config/rag.config.ts](../backend/src/config/rag.config.ts) — Configuration
- [backend/src/types/document.ts](../backend/src/types/document.ts) — Document types
- [backend/src/types/retrieval.ts](../backend/src/types/retrieval.ts) — Retrieval types
- [backend/.env.example](../backend/.env.example) — Environment template
