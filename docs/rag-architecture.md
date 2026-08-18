# CargoRule AI RAG Architecture

## 1. Overview

CargoRule AI uses Retrieval-Augmented Generation (RAG) to provide accurate, source-backed answers to logistics and customs compliance questions. 

**Why RAG?**

Customs regulations, shipping policies, and carrier agreements are complex, frequently updated, and highly country and carrier-specific. Rather than relying on a Large Language Model's training data (which can be outdated or generic), RAG allows CargoRule AI to:

1. **Ground answers in approved company documents** — Every answer is backed by official policy documents
2. **Reduce hallucination** — The model cannot invent regulations; it must cite retrieved information
3. **Support metadata filtering** — Questions can be answered in the context of specific countries, carriers, or document types
4. **Maintain compliance** — Answers reflect the company's actual policies, not generic industry knowledge
5. **Enable easy updates** — When policies change, documents are updated and re-indexed; no model retraining needed

## 2. High-Level Architecture

### Document Ingestion Pipeline

```
    Document Upload (PDF/DOCX/TXT)
             ↓
        Text Extraction
             ↓
        Text Cleaning
             ↓
     Metadata Extraction
             ↓
        Text Chunking
             ↓
    Embedding Generation
             ↓
     Vector Database Storage
```

### Query and RAG Pipeline

```
        User Question
             ↓
    Question Embedding
             ↓
    Metadata Filtering
    (Country, Carrier, Type, Date)
             ↓
    Vector Similarity Search
             ↓
     Top-K Relevant Chunks
             ↓
    Context Construction
             ↓
   OpenAI-Compatible LLM
      with RAG Context
             ↓
    Answer + Source Attribution
```

## 3. Document Processing Flow

When a user uploads a document, the following pipeline is executed:

1. **Document Upload** — User uploads a document (PDF, DOCX, or TXT)
2. **Text Extraction** — Text is extracted from the document (handling formatting, headers, footers)
3. **Text Cleaning** — Text is normalized:
   - Extra whitespace removed
   - Special characters handled
   - Encoding issues corrected
   - Boilerplate text (if identifiable) flagged
4. **Metadata Extraction** — Document-level metadata is captured:
   - Document name and ID
   - Upload date
   - Document type (Regulation, Policy, Agreement, etc.)
   - Country or region
   - Carrier (if applicable)
   - Effective date
   - Version
   - Any custom tags or categories
5. **Text Chunking** — Text is split into semantically meaningful chunks (see Section 4)
6. **Embedding Generation** — Each chunk is embedded using a consistent embedding model
7. **Vector Database Storage** — Chunks, embeddings, and metadata are stored for later retrieval

## 4. Chunking Strategy

Effective chunking is critical to RAG performance. CargoRule AI uses a **section-aware chunking strategy** that respects document structure rather than blindly splitting text.

### Recommended Parameters

- **Chunk size:** 500–800 tokens (~1500–2400 characters, depending on language)
- **Chunk overlap:** 50–100 tokens (~150–300 characters)
- **Preservation of structure:** Headings, paragraphs, and lists are kept intact where possible

### Strategy Details

1. **Preserve headings** — Each chunk begins with its relevant heading(s), providing context
2. **Preserve paragraphs** — Paragraph boundaries are respected; a paragraph is not split unless it exceeds the token limit
3. **Preserve lists** — Related list items are grouped together; numbered or bulleted lists are not arbitrarily split
4. **Avoid splitting tables** — Entire tables are kept together, as splitting would destroy meaning
5. **Avoid splitting rule definitions** — Key policy or rule definitions are preserved intact
6. **Semantic coherence** — Related policy/rule content is kept together to maintain contextual meaning

### Why This Approach?

Logistics and customs documents are highly structured:

- **Headings provide context** — A regulation about "Lithium Batteries" is different from one about "Electronics"
- **Lists must stay together** — A multi-item import requirement list cannot be split across chunks
- **Tables encode policy** — A table of country-specific requirements must be retrieved as a complete unit
- **Rule definitions are atomic** — A policy definition cannot be split; context and scope must be preserved

This approach ensures that retrieved chunks are genuinely useful and contain enough context for accurate LLM reasoning.

## 5. Metadata Strategy

Each document chunk is stored with rich metadata to enable filtered retrieval and source attribution.

### Required Metadata Fields

```typescript
{
  documentId: string;              // Unique document identifier
  documentName: string;            // Human-readable document name
  country?: string;                // Country/region (e.g., "Germany", "India")
  carrier?: string;                // Carrier name (e.g., "DHL", "FedEx")
  documentType?: string;           // Type (e.g., "Customs Regulation", "Shipping Policy", "Carrier Agreement")
  section?: string;                // Document section/heading
  pageNumber?: number;             // Original page number in document
  effectiveDate?: string;          // Date when policy takes effect (ISO 8601)
  version?: string;                // Document version (e.g., "v2", "2024-06-01")
  chunkIndex: number;              // Sequential index of chunk within document
}
```

### How Metadata Enables Filtering

Example scenario:

**Question:** "What are the shipping requirements for Germany using DHL?"

**Metadata Filtering:**
1. Filter document chunks where `country === "Germany"`
2. Further filter where `carrier === "DHL"`
3. Perform vector search only on remaining chunks

This dramatically reduces the search space and ensures answers are contextually correct.

**Another scenario:**

**Question:** "What was the requirement before 2024?"

**Metadata Filtering:**
1. Filter chunks where `effectiveDate < "2024-01-01"` OR `version < "2024"`

Metadata filtering is applied **before** vector search to improve relevance and performance.

## 6. Embedding Workflow

### Embedding Generation Process

```
Document Chunk (Text)
        ↓
   Embedding Model
   (e.g., OpenAI's text-embedding-3-small)
        ↓
  Dense Vector
  (e.g., 1536 dimensions)
        ↓
Vector Database
(Stores: vector, content, metadata)
```

### Consistency Requirement

**Critical:** The same embedding model must be used for:
- Document chunks during ingestion
- User questions during retrieval

If different models are used, vector similarity search will produce meaningless results.

### Embedding Model Selection

The embedding model should:
1. Be specialized for semantic search (not general-purpose models like GPT embeddings)
2. Support the languages relevant to CargoRule (English, and potentially others)
3. Have reasonable dimensionality (typically 768–3072 dimensions)
4. Be deterministic (same input always produces same output)

**Recommended initial model:** OpenAI's `text-embedding-3-small` or equivalent open-source alternative (e.g., `sentence-transformers/all-MiniLM-L6-v2`)

## 7. Query Embedding Workflow

### User Question to Query Vector

When a user asks a question, the following process occurs:

```
User Question (Text)
        ↓
   Embedding Model
   (Same model used for documents)
        ↓
  Query Vector
  (Same dimensions as document embeddings)
        ↓
Vector Database Similarity Search
```

### Example

- **User question:** "What documents are required to ship lithium batteries from India to Germany?"
- **Query vector:** 1536-dimensional vector representing the semantic meaning of the question
- **Vector database:** Compares query vector to all document chunk vectors using cosine similarity
- **Result:** Sorted list of most similar chunks, with similarity scores

## 8. Retrieval Strategy

### Vector Similarity Search with Metadata Filtering

CargoRule AI uses a **hybrid retrieval strategy**:

1. **Metadata filtering** (pre-search) — Apply country, carrier, document type, and date filters
2. **Vector similarity search** — Find Top-K semantically similar chunks
3. **Rank by relevance** — Return ranked by similarity score

### Top-K Retrieval

**Initial recommendation: K = 5**

This means the system retrieves the 5 most relevant document chunks for each question.

**Why Top-K?**

- Provides sufficient context without overwhelming the LLM
- Balances coverage (more chunks = more information) with focus (fewer chunks = clearer reasoning)
- Reduces token consumption
- Faster processing

**Future evaluation:**

Top-K can be dynamically adjusted based on:
- Question complexity (complex queries might need K=10)
- Document relevance scores (if similarity is high, K=3 might suffice)
- User preferences

### Metadata Filters

**Supported filters:**

| Filter | Type | Example | Purpose |
|--------|------|---------|---------|
| Country | String or Array | "Germany" or ["Germany", "Austria"] | Retrieve country-specific policies |
| Carrier | String or Array | "DHL" or ["DHL", "FedEx"] | Retrieve carrier-specific agreements |
| Document Type | String or Array | "Customs Regulation" | Retrieve specific document categories |
| Effective Date Range | Date Range | `{ from: "2024-01-01", to: "2024-12-31" }` | Retrieve policies valid for a date range |

### Retrieval API

```typescript
interface RetrievalQuery {
  question: string;
  filters?: {
    country?: string[];
    carrier?: string[];
    documentType?: string[];
    dateRange?: {
      from?: string;  // ISO 8601
      to?: string;    // ISO 8601
    };
  };
  topK?: number;  // Default: 5
}

interface RetrievedChunk {
  documentId: string;
  documentName: string;
  section: string;
  content: string;
  metadata: DocumentMetadata;
  relevanceScore: number;  // 0–1, where 1 is most relevant
}
```

## 9. Context Construction

Retrieved chunks are converted into a structured context that is passed to the LLM.

### Context Format

```
Relevant Information:

[1] Germany Customs Regulation (Section: Import Documentation, Page: 14)
    Effective: 2026-01-01 | Version: v2
    Content: [chunk text]
    
[2] DHL Shipping Policy (Section: Restricted Items, Page: 8)
    Effective: 2025-06-01 | Version: v1
    Content: [chunk text]

[3] Germany Customs Regulation (Section: Lithium Batteries, Page: 23)
    Effective: 2026-01-01 | Version: v2
    Content: [chunk text]

... (additional chunks)
```

### Context Preservation

Each retrieved source retains:
- **Document name** — Identifies the policy document
- **Section** — The specific section within the document
- **Page number** — For easy manual reference
- **Country/Carrier tags** — Contextual identifiers
- **Effective date** — When the policy is valid
- **Content** — The actual chunk text

This information enables:
1. **Source verification** — Users can review the original document
2. **Compliance confidence** — Operations teams know the exact policy reference
3. **Audit trails** — Query history includes source documents
4. **Metadata reasoning** — The LLM can reason about policy recency and applicability

## 10. Prompt Strategy

The system prompt provided to the LLM enforces grounding in retrieved context.

### Core Principles

```
You are a logistics compliance assistant. 

Your role is to answer questions about customs regulations, shipping policies, 
and carrier agreements using ONLY the provided document context.

**STRICT RULES:**

1. Answer using ONLY the retrieved context provided below.
2. Do NOT invent or assume customs regulations.
3. Do NOT rely on external knowledge about policies.
4. Do NOT make up carrier requirements.
5. If the retrieved context does NOT contain sufficient information to answer 
   the question, explicitly state:
   "I could not find sufficient information in the available documents 
    to determine the applicable requirement. Please consult [specific document name]."

6. Always cite your sources. Include:
   - Document name
   - Section
   - Page number (if available)

7. If multiple policies conflict, acknowledge the conflict and present all relevant policies.

**OUTPUT FORMAT:**

Answer: [Your answer, grounded in context]

Sources:
- [Document Name], Section: [Section], Page: [Page]
- [Document Name], Section: [Section], Page: [Page]
```

### LLM Instructions

- **Always cite sources** — Every claim must be traceable to a specific document section
- **Never extrapolate** — Do not guess how policy X might apply to scenario Y
- **Acknowledge uncertainty** — If context is unclear or insufficient, say so
- **Preserve specificity** — If policy differs by country/carrier, clarify the distinction
- **Explain limitations** — If information is outdated or incomplete, state that

## 11. Source Attribution

Users see the exact sources used to generate each answer.

### User-Facing Output

```
Question: What documents are required to ship lithium batteries from India to Germany?

Answer:
To ship lithium batteries from India to Germany, the following documentation 
is required:

1. Lithium Battery Declaration Form (FORM-LI-001)
2. Safety Data Sheet (SDS)
3. Country-of-Origin Certificate
4. Carrier-specific Lithium Authorization

**Sources:**
- Germany Customs Regulation, Section: Lithium Batteries, Page: 23, Version: v2
- DHL Shipping Policy, Section: Restricted Items, Page: 8, Version: v1
- India Export Requirements, Section: Electronics & Batteries, Page: 5, Version: v3
```

### Benefits

1. **Transparency** — Operations teams understand where information comes from
2. **Auditability** — Decisions are backed by documented policies
3. **Verifiability** — Users can cross-check answers against source documents
4. **Accountability** — The system is not a black box; reasoning is traceable

## 12. Hallucination Prevention

RAG significantly reduces hallucination by grounding answers in real documents.

### Mechanisms

1. **Retrieval-based constraint** — Answers must come from retrieved chunks
2. **Context window limit** — Only Top-K chunks are provided to the LLM, limiting "invention space"
3. **Explicit grounding** — The system prompt requires citation and forbids extrapolation
4. **Metadata validation** — Country/carrier specificity can be checked against question context

### Fallback Mechanism

If a question cannot be answered from available documents:

```
Question: What are the latest regulations for shipping to Mars?

Answer:
I could not find sufficient information in the available documents 
to determine the applicable requirement. The current document database 
covers Earth-based logistics for the following regions:
- European Union
- India
- United States
- Southeast Asia

If you need information for another region, please upload the relevant 
policy document or contact the compliance team.
```

This approach is **better than hallucination** because:
- Operations teams are not misled
- The limitation is transparent
- Users know to seek information elsewhere if needed

## 13. Future Improvements

The following enhancements can be evaluated and implemented as the system matures:

### Retrieval Optimization

1. **Hybrid search** — Combine BM25 keyword search with semantic search for better coverage
2. **Reranking** — Use a dedicated reranker model to improve ranking of Top-K results
3. **Query rewriting** — Automatically rewrite ambiguous user questions before embedding
4. **Multi-hop retrieval** — Retrieve related chunks iteratively for complex questions

### Document Processing

1. **Better table extraction** — Extract and preserve tabular data as structured metadata
2. **Formula and equation handling** — Preserve mathematical expressions and shipping rate calculations
3. **Image OCR** — Extract text from scanned documents or images within PDFs
4. **Document segmentation** — Automatically detect and preserve document sections

### Advanced RAG

1. **Parent-child retrieval** — Retrieve sentence-level chunks with parent paragraph context
2. **Hierarchical chunking** — Create multi-level chunk hierarchies for better context preservation
3. **Query classification** — Route different question types to different retrieval strategies
4. **Temporal reasoning** — Better handle policy effective dates and version histories

### Evaluation

1. **Retrieval evaluation** — Measure whether top-K results actually contain answer to question
2. **Chunk-size experimentation** — Test different chunk sizes on real logistics questions
3. **Embedding model comparison** — Evaluate different embedding models for customs/logistics domain
4. **User feedback loops** — Collect feedback on answer quality and adjust retrieval parameters

### User Experience

1. **Confidence scoring** — Display confidence in the answer based on retrieval quality
2. **Follow-up suggestions** — Suggest related questions based on retrieved documents
3. **Multi-language support** — Support questions and documents in multiple languages
4. **Custom filters** — Allow users to save and reuse filter combinations

These improvements should be evaluated against real logistics questions and operational needs before implementation.

---

## Implementation Checklist

As the RAG system is built, the following components should be implemented:

- [ ] Document ingestion pipeline (upload, extract, clean, chunk)
- [ ] Embedding generation service (consistent model usage)
- [ ] Vector database integration
- [ ] Metadata storage and indexing
- [ ] Retrieval service (vector search + metadata filtering)
- [ ] LLM integration (OpenAI-compatible API)
- [ ] Prompt engineering and testing
- [ ] Source attribution pipeline
- [ ] Hallucination prevention validation
- [ ] Query history and audit logging
- [ ] User-facing API endpoints

## Configuration and Deployment

Key configuration parameters to be set during deployment:

```typescript
// Embedding Configuration
EMBEDDING_MODEL = "text-embedding-3-small";
EMBEDDING_DIMENSIONS = 1536;

// Chunking Configuration
CHUNK_SIZE_TOKENS = 600;          // Target chunk size
CHUNK_OVERLAP_TOKENS = 75;        // Overlap between chunks

// Retrieval Configuration
DEFAULT_TOP_K = 5;                // Number of retrieved chunks
SIMILARITY_THRESHOLD = 0.5;       // Minimum similarity score

// LLM Configuration
LLM_MODEL = "gpt-4";              // OpenAI-compatible model
LLM_TEMPERATURE = 0.2;            // Lower temperature for factual answers
LLM_MAX_TOKENS = 1000;            // Maximum response length

// Vector Database Configuration
VECTOR_DB_URL = "<vector-database-url>";
VECTOR_DB_API_KEY = "<secure-api-key>";
```

These parameters should be configurable via environment variables or configuration files, never hardcoded.
