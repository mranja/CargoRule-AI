import { EmbeddingConfig, RetrievalConfig } from "../src/config/rag.config";
import { DocumentChunk, Embedding } from "../src/types/document";
import {
  createInMemoryVectorStore,
  matchesFilters,
  retrieveForQuery,
  retrieveRelevantChunks,
} from "../src/services/retrieval";
import {
  FIXTURE_LITHIUM_DOCS,
  FIXTURE_LITHIUM_QUERY,
  FIXTURE_LITHIUM_RELATED,
  FIXTURE_UNRELATED_WAREHOUSE,
} from "./fixtures/embedding-samples";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const FIXTURE_VOCAB = Array.from(
  new Set(
    [
      FIXTURE_LITHIUM_DOCS,
      FIXTURE_LITHIUM_RELATED,
      FIXTURE_UNRELATED_WAREHOUSE,
      FIXTURE_LITHIUM_QUERY,
    ]
      .join(" ")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  )
).filter((token) => token !== "test" && token !== "fixture");

function tokenVector(text: string): number[] {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const vector = FIXTURE_VOCAB.map((word) => counts.get(word) ?? 0);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function createSampleChunks(): { chunks: DocumentChunk[]; embeddings: Embedding[] } {
  const chunks: DocumentChunk[] = [
    {
      id: "doc_lithium_001",
      documentId: "doc_germany_customs",
      content: FIXTURE_LITHIUM_DOCS,
      chunkIndex: 0,
      metadata: {
        documentName: "Germany Customs Regulation",
        country: "Germany",
        carrier: "DHL",
        documentType: "Customs Regulation",
        section: "Lithium Batteries",
        effectiveDate: "2026-01-01",
        version: "v2",
      },
    },
    {
      id: "doc_lithium_002",
      documentId: "doc_dhl_policy",
      content: FIXTURE_LITHIUM_RELATED,
      chunkIndex: 0,
      metadata: {
        documentName: "DHL Battery Transport Policy",
        country: "Global",
        carrier: "DHL",
        documentType: "Shipping Policy",
        section: "Battery Packaging",
        effectiveDate: "2025-06-01",
        version: "v1",
      },
    },
    {
      id: "doc_warehouse_001",
      documentId: "doc_us_storage",
      content: FIXTURE_UNRELATED_WAREHOUSE,
      chunkIndex: 0,
      metadata: {
        documentName: "US Warehouse Guidelines",
        country: "USA",
        carrier: "FedEx",
        documentType: "Carrier Agreement",
        section: "Dry Storage",
        effectiveDate: "2024-01-01",
        version: "v1",
      },
    },
  ];

  const embeddings: Embedding[] = chunks.map((c) => ({
    chunkId: c.id,
    vector: tokenVector(c.content),
    embeddingModel: EmbeddingConfig.model,
  }));

  return { chunks, embeddings };
}

async function testFilterMatching(): Promise<void> {
  const meta = {
    documentName: "Test Doc",
    country: "Germany",
    carrier: "DHL",
    documentType: "Customs Regulation",
    effectiveDate: "2026-01-15",
    version: "v2",
  };

  assert(matchesFilters(meta, undefined), "Undefined filters should match all");
  assert(matchesFilters(meta, { country: ["Germany"] }), "Exact country match should pass");
  assert(matchesFilters(meta, { country: ["germany", "austria"] }), "Case-insensitive array match should pass");
  assert(!matchesFilters(meta, { country: ["USA"] }), "Unmatched country should fail");

  assert(matchesFilters(meta, { carrier: ["DHL"] }), "Carrier match should pass");
  assert(!matchesFilters(meta, { carrier: ["FedEx"] }), "Unmatched carrier should fail");

  assert(matchesFilters(meta, { documentType: ["Customs Regulation"] }), "DocType match should pass");
  assert(!matchesFilters(meta, { documentType: ["Carrier Agreement"] }), "Unmatched DocType should fail");

  assert(matchesFilters(meta, { version: ["v2"] }), "Version match should pass");
  assert(!matchesFilters(meta, { version: ["v1"] }), "Unmatched version should fail");

  assert(
    matchesFilters(meta, { dateRange: { from: "2026-01-01", to: "2026-02-01" } }),
    "Date range in bounds should pass"
  );
  assert(
    !matchesFilters(meta, { dateRange: { from: "2026-02-01" } }),
    "Date range out of bounds (too late from) should fail"
  );
  assert(
    !matchesFilters(meta, { dateRange: { to: "2025-12-31" } }),
    "Date range out of bounds (too early to) should fail"
  );

  console.log("Filter matching unit tests passed");
}

async function testVectorStoreSearch(): Promise<void> {
  const store = createInMemoryVectorStore();
  const { chunks, embeddings } = createSampleChunks();
  await store.upsert(chunks, embeddings);

  assert((await store.count()) === 3, "Store count should be 3");

  const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

  // Search without filter
  const results = await store.search(queryVec, { topK: 3 });
  assert(results.length === 3, "Should return all 3 chunks");
  assert(results[0].id.startsWith("doc_lithium"), "Most relevant chunk should be a lithium document");
  assert(results[0].rankingPosition === 1, "Ranking position should be 1");
  assert(results[0].relevanceScore > results[2].relevanceScore, "Score of #1 should be higher than #3");

  // Search with country filter
  const filteredResults = await store.search(queryVec, {
    topK: 3,
    filters: { country: ["USA"] },
  });
  assert(filteredResults.length === 1, "Only 1 chunk matches USA");
  assert(filteredResults[0].id === "doc_warehouse_001", "USA chunk should be returned");

  console.log("Vector store search and filtering tests passed");
}

async function testRetrieveRelevantChunksFunction(): Promise<void> {
  const store = createInMemoryVectorStore();
  const { chunks, embeddings } = createSampleChunks();
  await store.upsert(chunks, embeddings);

  const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

  // Retrieve top-2
  const top2 = await retrieveRelevantChunks(queryVec, undefined, 2, store);
  assert(top2.length === 2, "Should return 2 chunks");
  assert(top2[0].rankingPosition === 1, "First result rank 1");
  assert(top2[1].rankingPosition === 2, "Second result rank 2");

  // Verify invalid query vector error
  let invalidThrew = false;
  try {
    await retrieveRelevantChunks([], undefined, 2, store);
  } catch {
    invalidThrew = true;
  }
  assert(invalidThrew, "Empty query vector should throw error");

  console.log("retrieveRelevantChunks function tests passed");
}

async function testEndToEndQueryRetrieval(): Promise<void> {
  const store = createInMemoryVectorStore();
  const { chunks, embeddings } = createSampleChunks();
  await store.upsert(chunks, embeddings);

  const mockEmbeddingClient = {
    async embed(inputs: string[]) {
      return inputs.map((t) => tokenVector(t));
    },
  };

  const response = await retrieveForQuery(FIXTURE_LITHIUM_QUERY, {
    vectorStore: store,
    embeddingClient: mockEmbeddingClient,
  });

  assert(response.success, "Response success should be true");
  assert(response.query === FIXTURE_LITHIUM_QUERY, "Query string matches");
  assert(response.retrievedChunksCount > 0, "Retrieved chunks count > 0");
  assert(response.retrievedChunks[0].id.startsWith("doc_lithium"), "Top chunk matches lithium doc");
  assert(response.totalChunksAvailable === 3, "Total chunks available is 3");
  assert(response.totalChunksSearched === 3, "Total chunks searched is 3");
  assert(response.averageRelevanceScore > 0, "Average relevance score > 0");
  assert(typeof response.performance.totalTimeMs === "number", "Performance timings present");

  // With filter for DHL carrier
  const filteredResponse = await retrieveForQuery(
    {
      question: FIXTURE_LITHIUM_QUERY,
      filters: { carrier: ["DHL"] },
      parameters: { topK: 5 },
    },
    {
      vectorStore: store,
      embeddingClient: mockEmbeddingClient,
    }
  );

  assert(filteredResponse.success, "Filtered response success should be true");
  assert(filteredResponse.totalChunksSearched === 2, "Searched 2 matching DHL chunks");
  assert(filteredResponse.retrievedChunksCount === 2, "Retrieved 2 DHL chunks");
  assert(
    filteredResponse.retrievedChunks.every((c) => c.metadata.carrier === "DHL"),
    "All retrieved chunks must have carrier DHL"
  );

  console.log("End-to-end query retrieval test passed", {
    query: response.query,
    retrievedCount: response.retrievedChunksCount,
    topMatch: response.retrievedChunks[0].metadata.documentName,
    topScore: response.retrievedChunks[0].relevanceScore.toFixed(4),
  });
}

async function main(): Promise<void> {
  await testFilterMatching();
  await testVectorStoreSearch();
  await testRetrieveRelevantChunksFunction();
  await testEndToEndQueryRetrieval();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
