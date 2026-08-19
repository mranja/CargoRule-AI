# CargoRule AI: RAG Quick Reference Guide

## Key Files at a Glance

| File | Purpose | Status |
|------|---------|--------|
| `docs/rag-architecture.md` | Complete RAG system architecture, design decisions | ✅ Created |
| `docs/embedding-workflow.md` | Detailed data flow with examples for ingestion and retrieval | ✅ Created |
| `docs/retrieval-strategy.md` | Retrieval algorithm, filtering, Top-K, metadata | ✅ Created |
| `docs/implementation-roadmap.md` | 7-phase implementation plan, component reference | ✅ Created |
| `backend/src/types/document.ts` | DocumentChunk, DocumentMetadata interfaces | ✅ Created |
| `backend/src/types/retrieval.ts` | RetrievalQuery, RetrievalResponse, RetrievedChunk | ✅ Created |
| `backend/src/config/rag.config.ts` | RAG configuration with environment variable support | ✅ Created |
| `backend/.env.example` | Environment variable template with instructions | ✅ Created |

## Architecture in 30 Seconds

```
User Question
     ↓
 Embed Question (same model as docs)
     ↓
Apply Metadata Filters
     ↓
Vector Similarity Search (Top-K=5)
     ↓
Retrieve Chunks + Metadata
     ↓
Construct Context for LLM
     ↓
Generate Answer using OpenAI
     ↓
Format Answer + Sources
     ↓
Return to User
```

## Data Flow: Document Upload

```
PDF File
  ↓ Extract Text
Text (raw)
  ↓ Clean + Normalize
Text (clean, structured)
  ↓ Chunk (preserve structure)
Chunks with Metadata
  ↓ Generate Embeddings
Vectors (1536 dimensions)
  ↓ Store in Vector DB
Ready for Search
```

## Data Flow: User Query

```
Question: "Germany DHL lithium requirements?"
  ↓ Extract Filters
  { country: ["Germany"], carrier: ["DHL"] }
  ↓ Embed Question
  Vector (1536 dimensions)
  ↓ Apply Metadata Filters
  47 matching chunks (from 5000)
  ↓ Vector Search (Top-5)
  5 most relevant chunks with scores
  ↓ Format Context
  ~2500 tokens of context
  ↓ Call LLM with Context
  "Based on retrieved documents: ..."
  ↓ Add Sources
  "Sources: Germany Customs Regulation, Page 14"
```

## Essential Configuration

```typescript
// Embedding (MUST be consistent)
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

// Chunking (tuned for logistics docs)
CHUNK_SIZE_TOKENS = 600
CHUNK_OVERLAP_TOKENS = 75

// Retrieval (balanced)
RETRIEVAL_DEFAULT_TOP_K = 5

// LLM (factual, grounded)
LLM_MODEL = "gpt-4"
LLM_TEMPERATURE = 0.2
```

## TypeScript Types Quick Reference

### Document Chunk
```typescript
interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: {
    documentName: string;
    country?: string;
    carrier?: string;
    documentType?: string;
    section?: string;
    pageNumber?: number;
    effectiveDate?: string;
    version?: string;
  };
}
```

### Retrieval Query
```typescript
interface RetrievalQuery {
  question: string;
  filters?: {
    country?: string[];
    carrier?: string[];
    documentType?: string[];
    dateRange?: { from?: string; to?: string };
  };
  topK?: number;  // Default: 5
}
```

### Retrieval Response
```typescript
interface RetrievalResponse {
  query: string;
  retrievedChunks: RetrievedChunk[];  // Ranked by relevance
  averageRelevanceScore: number;       // 0-1
  totalChunksAvailable: number;
  totalChunksSearched: number;
}
```

## Metadata Filtering Examples

### Query: "Germany shipping"
**Inferred Filters:**
```json
{ "country": ["Germany"] }
```
**Search Space:** From 5000 chunks → ~800 chunks

### Query: "DHL lithium requirements"
**Inferred Filters:**
```json
{ "carrier": ["DHL"], "documentType": ["Shipping Policy", "Prohibited Items List"] }
```
**Search Space:** From 5000 chunks → ~150 chunks

### Query: "Current India export rules"
**Inferred Filters:**
```json
{ 
  "country": ["India"],
  "dateRange": { "from": null, "to": "2026-08-18" }
}
```
**Search Space:** From 5000 chunks → ~200 chunks

## API Endpoints (Summary)

### Documents
```
POST   /api/documents/upload          → Upload and ingest
GET    /api/documents                 → List documents
GET    /api/documents/:id             → Get document status
DELETE /api/documents/:id             → Delete document
```

### Retrieval
```
POST   /api/retrieval/search          → Retrieve chunks
```

### Queries (RAG)
```
POST   /api/queries                   → Ask question (full RAG)
GET    /api/queries                   → Query history
POST   /api/queries/:id/feedback      → Submit feedback
```

## Troubleshooting Quick Tips

| Problem | Check | Solution |
|---------|-------|----------|
| "Embedding mismatch" | EMBEDDING_MODEL and EMBEDDING_DIMENSIONS | Must match: text-embedding-3-small = 1536 dims |
| "No results found" | Metadata filters | Too restrictive? Try without filters |
| "Low relevance scores" | Chunk quality | Are chunks semantically coherent? |
| "High latency" | Vector DB performance | Check indices are created properly |
| "API key invalid" | OPENAI_API_KEY and LLM_API_KEY | Verify keys have right permissions |
| "Hallucinated answer" | LLM_TEMPERATURE | Lower to 0.1 for production |

## Performance Targets

| Component | Target | Acceptable Range |
|-----------|--------|------------------|
| Embedding time (per chunk) | <100ms | <200ms |
| Metadata filtering | <50ms | <100ms |
| Vector search (Top-5) | <100ms | <300ms |
| LLM response time | <5s | <10s |
| **Total Query Time** | **<6s** | **<12s** |

## Critical Implementation Notes

### 🔴 MUST DO

1. **Use SAME embedding model for documents and queries**
   - Changing models requires re-embedding all documents
   - Verify consistency at startup

2. **Preserve document structure when chunking**
   - Preserve headings (context)
   - Preserve lists (atomic units)
   - Preserve tables (complete data)

3. **Include rich metadata in every chunk**
   - documentName (for source attribution)
   - country/carrier (for filtering)
   - section (for user reference)
   - pageNumber (for manual verification)

4. **Apply metadata filters BEFORE vector search**
   - Dramatically improves relevance
   - Reduces computation cost
   - Essential for multi-tenant or multi-country scenarios

5. **Use low LLM temperature for logistics questions**
   - Temperature = 0.1-0.2 (factual)
   - Never invent regulations
   - Always cite sources

### ⚠️ SHOULD DO

1. **Monitor retrieval quality metrics**
   - Average relevance score
   - User feedback ratings
   - False positive rate

2. **Log all queries and answers**
   - For audit trails
   - For continuous improvement
   - For compliance verification

3. **Cache embeddings**
   - Avoid recomputing for repeated documents
   - Reduces API costs

4. **Set retrieval timeout**
   - Prevent hanging requests
   - Recommended: 5 seconds

5. **Validate LLM responses**
   - Check for hallucinations
   - Verify source citations
   - Detect low-confidence answers

### ❌ NEVER DO

1. **Hardcode API keys**
   - Use environment variables
   - Use secure secret management in production

2. **Mix embedding models**
   - Query embedding ≠ Document embedding → Meaningless results
   - Always verify model consistency

3. **Split important information across chunks**
   - Lithium battery rule must stay together
   - Country-specific policy must be complete

4. **Ignore metadata filtering**
   - Leads to irrelevant results
   - Wastes LLM context tokens

5. **Use high temperature for compliance questions**
   - High temperature = hallucination risk
   - Use temperature 0.1-0.2 for factual answers

## Development Workflow

### 1. Setup
```bash
# Copy environment template
cp backend/.env.example backend/.env.local

# Edit with your API keys
nano backend/.env.local

# Verify configuration loads
npm run verify-config
```

### 2. Test Embedding Consistency
```bash
# Test that embedding model is consistent
npm run test -- embedding-consistency.test.ts
```

### 3. Test Chunking
```bash
# Test chunking on sample documents
npm run test -- chunking.test.ts
```

### 4. Test Retrieval
```bash
# Test retrieval with metadata filters
npm run test -- retrieval.test.ts
```

### 5. Manual Testing
```bash
# Upload test document
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@test-doc.pdf" \
  -F "country=Germany"

# Retrieve chunks
curl -X POST http://localhost:3001/api/retrieval/search \
  -H "Content-Type: application/json" \
  -d '{
    "question": "lithium battery requirements",
    "filters": { "country": ["Germany"] }
  }'

# Ask a full RAG question
curl -X POST http://localhost:3001/api/queries \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What documents are needed for Germany?"
  }'
```

## Success Criteria

### Phase 1-2 Completion
- ✅ All environment variables configured
- ✅ Document upload endpoint working
- ✅ Text extraction and cleaning working
- ✅ Chunking preserves structure

### Phase 3 Completion
- ✅ Embeddings consistent (same model)
- ✅ Vector database connected
- ✅ Chunks stored with metadata

### Phase 4 Completion
- ✅ Vector search retrieving relevant chunks
- ✅ Metadata filtering working
- ✅ Top-K ranking correct

### Phase 5 Completion
- ✅ LLM generating grounded answers
- ✅ Sources correctly attributed
- ✅ No hallucinations detected

### Phase 6 Completion
- ✅ Retrieval quality > 0.7 average score
- ✅ < 5% hallucination rate
- ✅ User feedback collection working

### Production Ready
- ✅ All tests passing
- ✅ Error handling comprehensive
- ✅ Monitoring and alerting active
- ✅ Documentation complete
- ✅ Performance within targets
- ✅ Security verified

## Resources

### Documentation
- [rag-architecture.md](./rag-architecture.md) — Full architecture
- [embedding-workflow.md](./embedding-workflow.md) — Data flows with examples
- [retrieval-strategy.md](./retrieval-strategy.md) — Detailed retrieval guide
- [implementation-roadmap.md](./implementation-roadmap.md) — Phase-by-phase plan

### Configuration
- [rag.config.ts](../backend/src/config/rag.config.ts) — All configuration constants
- [.env.example](../backend/.env.example) — Environment variable template

### Types
- [document.ts](../backend/src/types/document.ts) — Document and chunk types
- [retrieval.ts](../backend/src/types/retrieval.ts) — Retrieval request/response types

### External Resources
- [OpenAI API Docs](https://platform.openai.com/docs) — API reference
- [Embeddings Guide](https://platform.openai.com/docs/guides/embeddings) — Embedding best practices
- [Pinecone Docs](https://docs.pinecone.io/) — Vector database (if using Pinecone)
- [LlamaIndex](https://docs.llamaindex.ai/) — RAG framework reference
- [LangChain](https://docs.langchain.com/) — LLM orchestration framework

## Contact & Support

- **Architecture Questions:** See [rag-architecture.md](./rag-architecture.md)
- **Implementation Questions:** See [implementation-roadmap.md](./implementation-roadmap.md)
- **Data Flow Questions:** See [embedding-workflow.md](./embedding-workflow.md)
- **Retrieval Issues:** See [retrieval-strategy.md](./retrieval-strategy.md)
- **Configuration Issues:** See [.env.example](../backend/.env.example)

---

**Last Updated:** 2026-08-18
**Status:** ✅ Architecture Documented, Ready for Implementation
