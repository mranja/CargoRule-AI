# CargoRule AI: Retrieval Strategy Guide

## Overview

The retrieval strategy determines how user questions are answered using indexed documents. CargoRule AI uses a hybrid approach combining metadata filtering and vector similarity search.

## Retrieval Architecture

```
User Question
      │
      ├─→ Parse & Extract Filters (country, carrier, document type, date)
      │
      ├─→ Generate Query Embedding (same model as documents)
      │
      ├─→ Apply Metadata Filters in Vector Database
      │   (Reduce search space: e.g., 5,000 chunks → 47 relevant chunks)
      │
      ├─→ Vector Similarity Search
      │   (Rank remaining chunks by semantic relevance)
      │
      ├─→ Retrieve Top-K Results (K=5, ordered by relevance)
      │
      ├─→ Construct Context with Source Info
      │
      └─→ Pass to LLM with RAG Prompt
```

## Filter Types and Usage

### 1. Country Filter

**Purpose:** Retrieve only chunks applicable to a specific country or region.

**Examples:**
- "Germany" — Return only chunks tagged with Germany
- ["Germany", "Austria", "Switzerland"] — Return chunks for German-speaking regions
- "EU" — Return EU-wide policies
- "Global" — Return policies applicable everywhere

**Implementation:**

```typescript
interface CountryFilter {
  countries: string[];  // Array of country names or codes
  operator?: "any" | "all";  // "any" = OR, "all" = AND
  // Default: "any" (return if chunk matches ANY country in list)
}

// Example usage:
const filter: CountryFilter = {
  countries: ["Germany", "India"],
  operator: "any"
};
// Returns chunks where country ∈ ["Germany", "India"]
```

**When Inferred from Question:**
- "...for Germany" → Add Germany filter
- "...shipping to India" → Add India filter
- "...from India to Germany" → Add both India and Germany filters

### 2. Carrier Filter

**Purpose:** Retrieve only chunks applicable to a specific shipping carrier.

**Examples:**
- "DHL" — Return only DHL-specific policies
- ["DHL", "FedEx"] — Return policies for these carriers
- "Any" or null — Return global carrier policies

**Implementation:**

```typescript
interface CarrierFilter {
  carriers: string[];  // Array of carrier names
  operator?: "any" | "all";  // Default: "any"
  includeGlobal?: boolean;  // Include global policies? (Default: true)
}

// Example usage:
const filter: CarrierFilter = {
  carriers: ["DHL"],
  includeGlobal: true
};
// Returns DHL-specific chunks AND global carrier policies
```

**When Inferred from Question:**
- "...using DHL" → Add DHL filter
- "...with Carrier X" → Add Carrier X filter
- "...with any carrier" → No carrier filter (include all)

### 3. Document Type Filter

**Purpose:** Retrieve only specific types of documents (regulations, policies, agreements, etc.).

**Recommended Categories:**
- "Customs Regulation" — Official government customs rules
- "Shipping Policy" — Company or carrier shipping guidelines
- "Carrier Agreement" — Specific agreements with carriers
- "Import/Export Requirement" — Country-specific import/export rules
- "Prohibited Items List" — Items that cannot be shipped
- "Hazardous Materials" — Rules for dangerous goods
- "Documentation Requirement" — Required forms and certifications
- "Country-Specific Requirement" — Country regulations or guidelines

**Implementation:**

```typescript
interface DocumentTypeFilter {
  documentTypes: string[];  // Array of document type names
  operator?: "any" | "all";  // Default: "any"
}

// Example usage:
const filter: DocumentTypeFilter = {
  documentTypes: ["Customs Regulation", "Shipping Policy"]
};
// Returns chunks from customs regulations OR shipping policies
```

**When Inferred from Question:**
- Question mentions "regulation" → Add "Customs Regulation"
- Question mentions "policy" → Add "Shipping Policy"
- Question mentions "prohibited" → Add "Prohibited Items List"
- Question mentions "hazardous" → Add "Hazardous Materials"

### 4. Effective Date Range Filter

**Purpose:** Retrieve policies valid for a specific time period.

**Implementation:**

```typescript
interface DateRangeFilter {
  from?: string;  // ISO 8601 date, e.g., "2024-01-01"
  to?: string;    // ISO 8601 date, e.g., "2024-12-31"
  // from=null, to=null → all policies
  // from="2024-01-01", to=null → policies effective from 2024 onward
  // from=null, to="2024-12-31" → policies effective through 2024
}

// Example usage:
const filter: DateRangeFilter = {
  from: null,
  to: new Date().toISOString().split('T')[0]  // Today's date
};
// Returns policies currently in effect (effective date ≤ today)
```

**When Inferred from Question:**
- "current requirement" → Use today's date as upper bound
- "requirement as of 2024" → Use "2024-01-01" to "2024-12-31"
- "new requirement" → Use recent date as lower bound
- "old requirement" → Use past date as upper bound

### 5. Version Filter

**Purpose:** Retrieve specific versions of documents.

**Implementation:**

```typescript
interface VersionFilter {
  versions: string[];  // e.g., ["v1", "v2"] or ["2024-06-01"]
  operator?: "exact" | "latestOnly";  // Default: "exact"
}

// Example usage:
const filter: VersionFilter = {
  versions: ["v2"],
  operator: "exact"
};
// Returns only chunks from version v2
```

**Default Behavior:**
- If user asks current requirement → Use latest version only
- If user asks historical requirement → Include specific version

## Combined Filter Example

### Scenario: Question about Germany DHL lithium battery requirements

**Question:**
> "What are the current requirements for shipping lithium batteries to Germany using DHL?"

**Extracted Filters:**

```typescript
const retrievalQuery: RetrievalQuery = {
  question: "What are the current requirements for shipping lithium batteries to Germany using DHL?",
  filters: {
    country: ["Germany"],
    carrier: ["DHL"],
    documentType: ["Customs Regulation", "Shipping Policy", "Prohibited Items List"],
    dateRange: {
      from: null,
      to: "2026-08-18"  // Today's date
    }
  },
  topK: 5
};
```

**Vector Database Filter SQL (Conceptual):**

```sql
WHERE 
  (metadata.country IN ["Germany"] OR metadata.country = "Global")
  AND 
  (metadata.carrier IN ["DHL"] OR metadata.carrier = "Global")
  AND 
  metadata.documentType IN ["Customs Regulation", "Shipping Policy", "Prohibited Items List"]
  AND 
  (metadata.effectiveDate IS NULL OR metadata.effectiveDate <= "2026-08-18")
```

**Search Space Reduction:**
- Before filters: 5,320 total chunks
- After filters: 47 matching chunks
- Vector search applied to: 47 chunks only

## Semantic Vector Search

### How It Works

1. **Query vector** represents semantic meaning of the question
2. **Document vectors** represent semantic meaning of each chunk
3. **Similarity score** = cosine similarity between query and document vectors

### Similarity Score Interpretation

| Score | Interpretation | Action |
|-------|----------------|--------|
| 0.9–1.0 | Perfect semantic match | Highly relevant |
| 0.8–0.9 | Very high relevance | Highly relevant |
| 0.7–0.8 | High relevance | Very likely relevant |
| 0.6–0.7 | Moderate relevance | Possibly relevant |
| 0.5–0.6 | Low relevance | May have false positives |
| <0.5 | Very low relevance | Likely not relevant |

### Default Threshold

**Initial recommendation: No hard threshold**, but monitor for quality.

Retrieve Top-K regardless of score, but monitor average scores:
- If average score < 0.5 → Warn user ("Low confidence in results")
- If all scores < 0.3 → Suggest uploading more relevant documents

## Top-K Configuration

### Recommended: K = 5

**Why 5?**

1. **Sufficient context** — 5 chunks provide ~2,500–3,000 tokens of context
2. **LLM token budget** — Leaves room for response without exceeding typical limits
3. **Focused reasoning** — Fewer chunks = clearer focus, less "noise"
4. **Performance** — Fast retrieval and processing
5. **Empirically validated** — Common in production RAG systems

### Flexible Top-K Strategy

```typescript
interface RetrievalConfig {
  defaultTopK: number;           // Default: 5
  minTopK: number;               // Minimum: 1
  maxTopK: number;               // Maximum: 10
  
  // Dynamic adjustment based on query type
  topKByQueryType?: {
    simple: number;              // "What is X?" → K=3
    compound: number;            // "A and B?" → K=5
    complex: number;             // "Compare A, B, C?" → K=10
  };
  
  // Dynamic adjustment based on relevance
  adjustmentRules?: {
    highRelevance: {              // If top-K all have score > 0.8
      reduction: number;          // Reduce to K-2
    };
    lowRelevance: {               // If top-K all have score < 0.6
      increase: number;           // Increase to K+5
    };
  };
}
```

**Usage:**

```typescript
// Simple question
Q: "Is lithium banned in Germany?"
→ K = 3 (focused query, few highly relevant chunks)

// Compound question
Q: "What documents and certifications are needed for Germany?"
→ K = 5 (standard, balanced)

// Complex question
Q: "Compare lithium battery regulations across Germany, India, and USA, and explain carrier-specific requirements."
→ K = 10 (needs more context)
```

## Retrieval Query Interface

```typescript
interface RetrievalQuery {
  // Required
  question: string;  // The user's question
  
  // Optional filters
  filters?: {
    country?: string[];
    carrier?: string[];
    documentType?: string[];
    dateRange?: {
      from?: string;  // ISO 8601
      to?: string;    // ISO 8601
    };
    version?: string[];
  };
  
  // Retrieval parameters
  topK?: number;                  // Default: 5
  similarityThreshold?: number;   // Default: null (no threshold)
  
  // Metadata flags
  includeRelevanceScores?: boolean;  // Default: true
  includeMetadata?: boolean;         // Default: true
}

interface RetrievalResponse {
  query: string;
  retrievedChunks: RetrievedChunk[];
  totalChunksSearched: number;      // After filtering
  totalChunksAvailable: number;     // Before filtering
  averageRelevanceScore: number;
  searchTimeMs: number;
}

interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: DocumentMetadata;
  relevanceScore: number;           // 0–1
  rankingPosition: number;          // 1 to K
}
```

## Retrieval API Endpoints

### Retrieve Chunks (RAG Retrieval)

```
POST /api/retrieval/search

Request:
{
  "question": "What documents are needed for Germany?",
  "filters": {
    "country": ["Germany"]
  },
  "topK": 5
}

Response:
{
  "query": "What documents are needed for Germany?",
  "retrievedChunks": [
    {
      "id": "doc_001_chunk_0",
      "documentId": "doc_001",
      "content": "...",
      "relevanceScore": 0.887,
      "rankingPosition": 1,
      "metadata": { ... }
    },
    // ... more chunks
  ],
  "totalChunksSearched": 47,
  "totalChunksAvailable": 5320,
  "averageRelevanceScore": 0.764,
  "searchTimeMs": 145
}
```

### Retrieval with Detailed Metadata

```
POST /api/retrieval/search-detailed

Returns the same as above but with full metadata including:
- document name
- section
- page number
- effective date
- version
- country
- carrier
```

## Performance Considerations

### Vector Database Indexing

For fast retrieval, the vector database should maintain:

1. **Vector index** — Fast approximate nearest neighbor search (HNSW or IVF)
2. **Metadata indices** — Fast filtering on:
   - country
   - carrier
   - documentType
   - effectiveDate
   - version

### Query Optimization

```
TIME BREAKDOWN (Typical):

Parsing & Filtering:        ~20 ms
Vector Search (47 chunks):  ~100 ms
Ranking & Formatting:       ~25 ms
─────────────────────────────────
TOTAL:                      ~145 ms
```

**Optimization Tips:**
- Index metadata heavily (filtering is fast, vector search is slow)
- Filter BEFORE vector search (reduces vectors to search)
- Cache embeddings (no need to recompute)
- Use approximate nearest neighbor algorithms (HNSW, IVF)
- Batch similar queries when possible

## Retrieval Evaluation

### Metrics to Track

1. **Mean Reciprocal Rank (MRR)** — Is the correct answer in top K?
2. **Normalized Discounted Cumulative Gain (NDCG)** — Are highly relevant chunks ranked first?
3. **Precision@5** — Of top-5 retrieved chunks, how many are truly relevant?
4. **Recall@5** — Of all relevant chunks, what % are in top-5?

### User Feedback Loop

```
User Question
    ↓
Retrieve & Answer
    ↓
Present Answer with Sources
    ↓
User Feedback: "Helpful" / "Not Helpful"
    ↓
Log: (question, retrieved_chunks, feedback)
    ↓
Analyze Patterns
    ↓
Adjust Top-K, Filters, or Embedding Model
    ↓
Re-index if needed
```

### Example: Evaluating Retrieval Quality

**Scenario:** User asks "What does Germany require for lithium shipping?"

**Retrieved Chunks:**
1. ✅ Germany Customs Regulation - Lithium section (0.91)
2. ✅ DHL Shipping Policy - Lithium section (0.84)
3. ✅ Germany Customs Regulation - Import Documentation (0.76)
4. ❌ India Customs Regulation - Electronics (0.62)  ← False positive
5. ✅ Germany Prohibited Items - Lithium batteries (0.58)

**Evaluation:**
- Precision@5 = 4/5 = 0.80 (80% of top-5 are relevant)
- MRR = 1/1 = 1.0 (first result is correct)
- User feedback: "Helpful" ✅

If user feedback was "Not Helpful", we would investigate:
- Did we use the wrong embedding model?
- Do we need better document segmentation?
- Should we filter more aggressively?

## Future Improvements

### Hybrid Search

Combine vector search with keyword search (BM25):

```
Score = (0.7 × VectorScore) + (0.3 × KeywordScore)
```

Benefits:
- Vector search excels at semantic meaning
- Keyword search excels at explicit matches
- Hybrid captures both

### Reranking

Use a specialized reranker model to improve Top-K ranking:

```
Retrieved Chunks (5) → Reranker Model → Re-ranked Chunks (5)
```

Reranker can:
- Break ties between similar vectors
- Promote chunks with better source attribution
- Demote chunks with potential hallucinations

### Query Rewriting

Automatically rewrite ambiguous queries:

```
Original: "shipping to france"
Rewritten: "shipping requirements for France customs"

Original: "li-ion batteries"
Rewritten: "lithium-ion battery regulations"
```

Benefits:
- Better embedding similarity
- Standardized query format
- Handles abbreviations and synonyms

---

## Implementation Checklist

- [ ] Design metadata schema (country, carrier, documentType, etc.)
- [ ] Choose vector database (Pinecone, Weaviate, Milvus, etc.)
- [ ] Implement filter builder (parse user question → filters)
- [ ] Implement vector search integration
- [ ] Implement Top-K ranking and sorting
- [ ] Implement context construction for LLM
- [ ] Add relevance score monitoring
- [ ] Add user feedback collection
- [ ] Add retrieval performance logging
- [ ] Create retrieval evaluation dashboard
- [ ] Document filter conventions for team
- [ ] Set up A/B testing framework for Top-K values
