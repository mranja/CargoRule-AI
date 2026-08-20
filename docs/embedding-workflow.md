# CargoRule AI: Embedding Workflow and Data Flow

## Overview

This document defines the precise data flow for:
1. Document ingestion and embedding
2. Query processing and retrieval
3. Context construction and LLM answering

## Document Ingestion Data Flow

### Phase 1: Upload and Extraction

```
┌─────────────────────────┐
│  User Uploads Document  │
│  (PDF/DOCX/TXT file)    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Extract Raw Text       │
│  - Parse PDF/DOCX       │
│  - Extract text         │
│  - Preserve order       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Capture Document       │
│  Metadata               │
│  - Document name        │
│  - Upload date          │
│  - Document type        │
│  - Country (if known)   │
│  - Carrier (if known)   │
└─────────────────────────┘
```

**Input Example:**
```
File: Germany_Customs_2026_v2.pdf
Extracted text (first 500 chars):
"Germany Customs Regulation 2026
Version 2.0
Effective: January 1, 2026

Chapter 1: Import Documentation

1.1 Lithium Batteries
..."
```

**Output Example:**
```typescript
{
  documentId: "doc_001",
  documentName: "Germany Customs Regulation",
  rawText: "Germany Customs Regulation 2026\nVersion 2.0\n...",
  metadata: {
    country: "Germany",
    documentType: "Customs Regulation",
    effectiveDate: "2026-01-01",
    version: "v2"
  }
}
```

### Phase 2: Cleaning and Preprocessing

```
┌──────────────────────────┐
│  Raw Extracted Text      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Text Cleaning           │
│  - Remove extra whitespace
│  - Normalize encoding    │
│  - Fix line breaks       │
│  - Remove boilerplate    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Extract Sections        │
│  - Identify headings     │
│  - Group paragraphs      │
│  - Preserve lists        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Cleaned, Structured Text│
└──────────────────────────┘
```

**Cleaning Example:**

Input:
```
Germany     Customs   Regulation     2026


Version  2.0

1.1    Lithium    Batteries
```

Output:
```
Germany Customs Regulation 2026
Version 2.0

1.1 Lithium Batteries
```

### Phase 3: Chunking

```
┌──────────────────────────────────────┐
│  Cleaned, Structured Text            │
│  (Full document, 50,000 tokens)      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Section-Aware Chunking              │
│  - Identify section headings         │
│  - Group related paragraphs          │
│  - Target size: 500-800 tokens       │
│  - Overlap: 50-100 tokens            │
│  - Preserve structure                │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Document Chunks                     │
│  - Chunk 0 (tokens 0-600)           │
│  - Chunk 1 (tokens 550-1150)        │
│  - Chunk 2 (tokens 1100-1700)       │
│  - ... (M chunks total)              │
└──────────────────────────────────────┘
```

**Chunking Example:**

Input document excerpt:
```
Chapter 1: Lithium Batteries

1.1 General Requirements
All lithium batteries shipped to Germany must comply with UN3480 
and UN3481 regulations. The shipper must provide:

1. Lithium Battery Declaration Form (LI-001)
2. Safety Data Sheet (SDS)
3. Proof of compliance with IEC 62619

1.2 Prohibited Items
The following items cannot be shipped to Germany:
- Damaged or recalled batteries
- Cells with defects
- Batteries without proper labeling
```

Output Chunks:

**Chunk 0:**
```
1.1 General Requirements

All lithium batteries shipped to Germany must comply with UN3480 
and UN3481 regulations. The shipper must provide:

1. Lithium Battery Declaration Form (LI-001)
2. Safety Data Sheet (SDS)
3. Proof of compliance with IEC 62619
```

**Chunk 1:**
```
1.1 General Requirements

All lithium batteries shipped to Germany must comply with UN3480 
and UN3481 regulations. The shipper must provide:

1. Lithium Battery Declaration Form (LI-001)
2. Safety Data Sheet (SDS)
3. Proof of compliance with IEC 62619

1.2 Prohibited Items

The following items cannot be shipped to Germany:
- Damaged or recalled batteries
- Cells with defects
- Batteries without proper labeling
```

**Chunk 2:**
```
1.2 Prohibited Items

The following items cannot be shipped to Germany:
- Damaged or recalled batteries
- Cells with defects
- Batteries without proper labeling
```

### Phase 4: Embedding Generation

```
┌──────────────────────────────────────┐
│  Document Chunk (Text String)        │
│  ~600 tokens                         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Embedding Model                     │
│  (text-embedding-3-small)            │
│  - Tokenize text                     │
│  - Forward through neural network    │
│  - Generate dense vector             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Embedding Vector                    │
│  - Type: float32[]                   │
│  - Dimensions: 1536                  │
│  - Range: typically [-1, 1]          │
└──────────────────────────────────────┘
```

**Embedding Example:**

Input:
```
1.1 General Requirements

All lithium batteries shipped to Germany must comply with UN3480 
and UN3481 regulations. The shipper must provide:

1. Lithium Battery Declaration Form (LI-001)
2. Safety Data Sheet (SDS)
3. Proof of compliance with IEC 62619
```

Model: `text-embedding-3-small`

Output:
```typescript
{
  chunkId: "doc_001_chunk_0",
  vector: [
    0.001234,
    -0.002456,
    0.000789,
    ... (1533 more dimensions)
  ],
  embeddingModel: "text-embedding-3-small"
}
```

### Phase 5: Vector Database Storage

```
┌──────────────────────────────────────┐
│  Embedding + Chunk + Metadata        │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Vector Database                     │
│  (Pinecone, Weaviate, Milvus, etc.)  │
│                                      │
│  Stores:                             │
│  - Vector (1536-dimensional)         │
│  - Chunk ID                          │
│  - Content (text)                    │
│  - Metadata (country, carrier, etc.) │
└──────────────────────────────────────┘
```

**Vector Database Entry Example:**

```json
{
  "id": "doc_001_chunk_0",
  "vector": [0.001234, -0.002456, 0.000789, ...],
  "metadata": {
    "documentId": "doc_001",
    "documentName": "Germany Customs Regulation",
    "country": "Germany",
    "carrier": "DHL",
    "documentType": "Customs Regulation",
    "section": "Lithium Batteries",
    "pageNumber": 14,
    "effectiveDate": "2026-01-01",
    "version": "v2",
    "chunkIndex": 0,
    "content": "1.1 General Requirements\n\nAll lithium batteries shipped to Germany..."
  }
}
```

**Key Point:** The vector database stores vectors indexed for fast similarity search, while metadata is indexed for fast filtering.

---

## Query and Retrieval Data Flow

### Phase 1: User Question and Embedding

```
┌──────────────────────────────────────┐
│  User Question (Text String)         │
│                                      │
│  "What documents are needed to ship  │
│   lithium batteries from India to    │
│   Germany using DHL?"                │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Embedding Model                     │
│  (SAME model as used for documents)  │
│  - Tokenize question                 │
│  - Forward through network           │
│  - Generate query vector             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Query Vector                        │
│  - Dimensions: 1536                  │
│  - Semantically represents question  │
└──────────────────────────────────────┘
```

**Example:**

Input Question:
```
"What documents are needed to ship lithium batteries from India to Germany using DHL?"
```

Model: `text-embedding-3-small` (SAME as used for document chunks)

Output Vector:
```typescript
{
  queryVector: [
    -0.005678,
    0.001234,
    -0.002456,
    ... (1533 more dimensions)
  ]
}
```

### Phase 2: Metadata Filtering

```
┌────────────────────────────────────────┐
│  Parse Retrieval Request               │
│  - Extract filters from question       │
│  - Parse explicit filters (if any)     │
│  - Infer context (country, carrier)    │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Build Filter Query                    │
│                                        │
│  WHERE country IN ["Germany", "India"] │
│  AND carrier = "DHL"                   │
│  AND documentType = "Regulation"       │
│  AND effectiveDate <= NOW              │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Apply Metadata Filters to Vector DB   │
│  - Reduce search space                 │
│  - Only consider relevant documents    │
│                                        │
│  Chunks matching filters: 47 of 5,320  │
└────────────────────────────────────────┘
```

**Filter Example:**

Question: "What documents are needed to ship lithium batteries from India to Germany using DHL?"

Inferred Filters:
```typescript
{
  country: ["Germany", "India"],        // Mentioned in question
  carrier: ["DHL"],                     // Mentioned in question
  documentType: ["Customs Regulation", "Shipping Policy"],  // Inferred
  effectiveDate: {
    from: null,
    to: "2026-08-18"  // Today's date
  }
}
```

### Phase 3: Vector Similarity Search

```
┌────────────────────────────────────────┐
│  Query Vector (from Phase 1)           │
│  Filtered Candidate Chunks: 47         │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Vector Similarity Search              │
│  - Compute cosine similarity between   │
│    query vector and candidate vectors  │
│  - Sort by similarity score            │
│  - Select Top-K results (K=5)          │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Top-K Chunks (K=5)                    │
│  Ranked by relevance score:            │
│                                        │
│  [1] doc_001_chunk_0 (0.887)          │
│  [2] doc_002_chunk_3 (0.821)          │
│  [3] doc_001_chunk_1 (0.765)          │
│  [4] doc_003_chunk_5 (0.654)          │
│  [5] doc_002_chunk_7 (0.612)          │
└────────────────────────────────────────┘
```

**Similarity Calculation Example:**

For query vector and each candidate chunk vector:

```
Cosine Similarity = (Query · Candidate) / (||Query|| · ||Candidate||)

Result: 0.887 (on scale of -1 to 1)
Interpretation: 0.887 = very high semantic similarity
```

### Phase 4: Context Construction

```
┌────────────────────────────────────────┐
│  Retrieved Top-K Chunks                │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Construct Context for LLM             │
│  - Format each chunk with metadata     │
│  - Preserve source information         │
│  - Add ranking information             │
│  - Maintain order                      │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  RAG Context (Ready for LLM)           │
│  ~3,000-4,000 tokens                   │
└────────────────────────────────────────┘
```

**Context Example:**

```
=== RETRIEVED CONTEXT ===

[1] Germany Customs Regulation (Section: Lithium Batteries, Page: 14)
    Country: Germany | Carrier: DHL | Document Type: Customs Regulation
    Effective: 2026-01-01 | Version: v2
    Relevance Score: 0.887
    
    Content:
    1.1 General Requirements
    All lithium batteries shipped to Germany must comply with UN3480 and 
    UN3481 regulations. The shipper must provide:
    1. Lithium Battery Declaration Form (LI-001)
    2. Safety Data Sheet (SDS)
    3. Proof of compliance with IEC 62619

[2] DHL Shipping Policy (Section: Restricted Items, Page: 8)
    Country: Global | Carrier: DHL | Document Type: Shipping Policy
    Effective: 2025-06-01 | Version: v1
    Relevance Score: 0.821
    
    Content:
    Lithium batteries must be packaged according to IATA guidelines.
    DHL accepts Class 9 hazardous goods shipments with proper 
    documentation. Contact regional compliance for approval.

[3] Germany Customs Regulation (Section: Import Documentation, Page: 23)
    Country: Germany | Carrier: Any | Document Type: Customs Regulation
    Effective: 2026-01-01 | Version: v2
    Relevance Score: 0.765
    
    Content:
    All import documents must be submitted within 5 business days 
    of shipment arrival. Required documents include commercial invoice, 
    packing list, and certificates of origin...

[4] India Export Requirements (Section: Electronics & Batteries, Page: 5)
    Country: India | Carrier: Any | Document Type: Export Requirement
    Effective: 2026-01-01 | Version: v3
    Relevance Score: 0.654
    
    Content:
    Indian exports of lithium batteries require clearance from 
    the Department of Explosives. Shipments must be declared in 
    advance...

[5] DHL Shipping Policy (Section: Documentation, Page: 3)
    Country: Global | Carrier: DHL | Document Type: Shipping Policy
    Effective: 2025-06-01 | Version: v1
    Relevance Score: 0.612
    
    Content:
    All shipments must include a commercial invoice, packing list, 
    and any required certificates. Original copies must accompany 
    the shipment.
```

### Phase 5: LLM Prompt Construction

```
┌────────────────────────────────────────┐
│  System Prompt                         │
│  (Defines RAG constraints)             │
│                                        │
│  "Answer ONLY using retrieved context" │
│  "Cite your sources"                   │
│  "Do not invent regulations"           │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  User Question                         │
│  "What documents are needed to ship    │
│   lithium batteries from India to      │
│   Germany using DHL?"                  │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Retrieved Context (from Phase 4)      │
│  ~3,000-4,000 tokens                   │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Complete Prompt Ready for LLM         │
│  ~4,500-5,500 tokens total             │
└────────────────────────────────────────┘
```

**Complete Prompt Example:**

```
You are a logistics compliance assistant for CargoRule AI.

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
    to determine the applicable requirement."
6. Always cite your sources. Include document name, section, and page number.
7. If multiple policies conflict, acknowledge the conflict and present all.

=== RETRIEVED CONTEXT ===

[1] Germany Customs Regulation (Section: Lithium Batteries, Page: 14)
    Country: Germany | Carrier: DHL | Document Type: Customs Regulation
    Effective: 2026-01-01 | Version: v2
    ...

[2] DHL Shipping Policy (Section: Restricted Items, Page: 8)
    ...

[3] Germany Customs Regulation (Section: Import Documentation, Page: 23)
    ...

[4] India Export Requirements (Section: Electronics & Batteries, Page: 5)
    ...

[5] DHL Shipping Policy (Section: Documentation, Page: 3)
    ...

=== END RETRIEVED CONTEXT ===

Question: What documents are needed to ship lithium batteries from India to 
Germany using DHL?

Answer using the above context. Include sources.
```

### Phase 6: LLM Response Generation

```
┌────────────────────────────────────────┐
│  OpenAI-Compatible LLM                 │
│  (e.g., GPT-4)                         │
│                                        │
│  Reads prompt + context                │
│  Generates answer grounded in context  │
│  Includes source citations             │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  LLM Response                          │
│                                        │
│  Answer + Sources + Reasoning          │
└────────────────────────────────────────┘
```

**Example LLM Response:**

```
To ship lithium batteries from India to Germany using DHL, you need 
the following documents:

From India Export Requirements:
1. Department of Explosives clearance (required for all Indian lithium 
   battery exports)
2. Advance shipment declaration

From Germany Customs Regulation:
1. Lithium Battery Declaration Form (LI-001) - mandatory for all lithium 
   batteries entering Germany
2. Safety Data Sheet (SDS) - technical specification document
3. Proof of compliance with IEC 62619 standard
4. Commercial invoice and packing list (general import requirement)
5. Certificate of origin (general import requirement)

From DHL Shipping Policy:
6. Shipment must comply with IATA guidelines for lithium battery packaging
7. Additional DHL regional compliance approval may be required (contact 
   DHL directly for confirmation)
8. Original copies of all documents must accompany the physical shipment

Summary:
In total, you need approximately 8 key documents/certifications, with 
the most critical being the India Department of Explosives clearance, 
Germany's LI-001 form, and compliance documentation.

Sources:
- Germany Customs Regulation, Section: Lithium Batteries, Page: 14, Version: v2
- Germany Customs Regulation, Section: Import Documentation, Page: 23, Version: v2
- India Export Requirements, Section: Electronics & Batteries, Page: 5, Version: v3
- DHL Shipping Policy, Section: Restricted Items, Page: 8, Version: v1
- DHL Shipping Policy, Section: Documentation, Page: 3, Version: v1
```

### Phase 7: Response to User

```
┌────────────────────────────────────────┐
│  LLM Response                          │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Format for User Display               │
│  - Clean up response                   │
│  - Format source links                 │
│  - Add query metadata                  │
│  - Log for audit trail                 │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Send to User                          │
│  - Display answer                      │
│  - Show sources with links             │
│  - Option to view document             │
│  - Save to query history               │
└────────────────────────────────────────┘
```

---

## Complete Data Example

This is a **STRUCTURAL EXAMPLE ONLY** — NOT real production data.

### Document Chunk Structure

```json
{
  "id": "doc_001_chunk_7",
  "documentId": "doc_001",
  "chunkIndex": 7,
  "content": "1.1 General Requirements\n\nAll lithium batteries shipped to Germany must comply with UN3480 and UN3481 regulations. The shipper must provide:\n\n1. Lithium Battery Declaration Form (LI-001)\n2. Safety Data Sheet (SDS)\n3. Proof of compliance with IEC 62619\n\nFailure to provide these documents will result in shipment rejection.",
  "metadata": {
    "documentId": "doc_001",
    "documentName": "Germany Customs Regulation",
    "country": "Germany",
    "carrier": "DHL",
    "documentType": "Customs Regulation",
    "section": "Lithium Batteries",
    "pageNumber": 14,
    "effectiveDate": "2026-01-01",
    "version": "v2"
  }
}
```

### Embedding Entry

```json
{
  "id": "doc_001_chunk_7",
  "vector": [0.001234, -0.002456, 0.000789, ...1533 more dimensions...],
  "embeddingModel": "text-embedding-3-small"
}
```

### Retrieved Chunk in Response

```json
{
  "id": "doc_001_chunk_7",
  "documentId": "doc_001",
  "chunkIndex": 7,
  "content": "1.1 General Requirements\n\nAll lithium batteries shipped to Germany must comply with UN3480 and UN3481 regulations...",
  "metadata": {
    "documentId": "doc_001",
    "documentName": "Germany Customs Regulation",
    "country": "Germany",
    "carrier": "DHL",
    "documentType": "Customs Regulation",
    "section": "Lithium Batteries",
    "pageNumber": 14,
    "effectiveDate": "2026-01-01",
    "version": "v2"
  },
  "relevanceScore": 0.887,
  "rankingPosition": 1
}
```

---

## Key Principles

### Consistency

**Single Embedding Model**: All document chunks and all user questions MUST use the SAME embedding model. Mixing models produces meaningless similarity scores.

### Traceability

Every answer must trace back to specific document chunks with:
- Document name
- Section/heading
- Page number
- Version/effective date

### Grounding

Answers are NEVER generated without context. If context is insufficient, the system explicitly states so rather than hallucinating.

### Filtering

Metadata filtering reduces the search space BEFORE vector similarity search, improving relevance and performance.

### Top-K Retrieval

Retrieving 5 relevant chunks balances coverage with focus. This can be adjusted during evaluation.

---

## Implementation Notes

- The embedding model must be configured once and reused consistently
- Vector database connection must be pooled for performance
- Metadata filtering should be implemented at the vector database layer
- Context construction should preserve exact formatting and pagination info
- LLM temperature should be low (~0.2) for factual answers
- Response should always include sources with direct links to documents
- Query history should log: question, retrieved chunks, LLM response, sources
