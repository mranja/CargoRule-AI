import { Server } from "http";
import { AddressInfo } from "net";
import { app } from "../src/server";
import { EmbeddingConfig } from "../src/config/rag.config";
import { DocumentChunk, Embedding } from "../src/types/document";
import { getDefaultVectorStore } from "../src/services/retrieval";
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

async function setupVectorStore(): Promise<void> {
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
        pageNumber: 14,
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
        pageNumber: 8,
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
        pageNumber: 3,
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

  const store = getDefaultVectorStore();
  await store.clear();
  await store.upsert(chunks, embeddings);
}

async function runApiTests(): Promise<void> {
  await setupVectorStore();

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test 1: Health endpoints
    {
      const res = await fetch(`${baseUrl}/health`);
      assert(res.status === 200, "Root /health should return 200");
      const data = await res.json();
      assert(data.status === "ok", "Root /health status should be ok");

      const retHealthRes = await fetch(`${baseUrl}/api/retrieval/health`);
      assert(retHealthRes.status === 200, "Retrieval /health should return 200");
      const retHealth = await retHealthRes.json();
      assert(retHealth.status === "healthy", "Retrieval status healthy");
      assert(retHealth.indexedChunks === 3, "Indexed chunks count should be 3");
      assert(retHealth.model === EmbeddingConfig.model, "Model matches config");
      assert(!retHealth.apiKey, "Health response must NOT expose apiKey");

      console.log("Health endpoints test passed");
    }

    // Test 2: POST /api/retrieval/search with question & carrier filter
    {
      const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

      // Using queryVector in the search endpoint directly
      const res = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: FIXTURE_LITHIUM_QUERY,
          queryVector: queryVec,
          filters: { carrier: ["DHL"] },
          topK: 5,
        }),
      });

      assert(res.status === 200, "Search endpoint should return 200 OK");
      const data = await res.json();

      assert(data.success === true, "Response success should be true");
      assert(data.retrievedChunksCount === 2, "Should return 2 DHL chunks");
      assert(data.retrievedChunks.length === 2, "Retrieved chunks array length is 2");
      assert(
        data.retrievedChunks.every((c: { metadata: { carrier: string } }) => c.metadata.carrier === "DHL"),
        "All chunks should have carrier DHL"
      );

      // Check ranking position & relevance score
      assert(data.retrievedChunks[0].rankingPosition === 1, "First chunk ranking 1");
      assert(data.retrievedChunks[1].rankingPosition === 2, "Second chunk ranking 2");
      assert(
        data.retrievedChunks[0].relevanceScore >= data.retrievedChunks[1].relevanceScore,
        "Chunks must be sorted by score descending"
      );

      // Check metadata fields
      const topChunk = data.retrievedChunks[0];
      assert(topChunk.metadata.documentName, "Chunk has documentName metadata");
      assert(topChunk.metadata.section, "Chunk has section metadata");
      assert(topChunk.metadata.effectiveDate, "Chunk has effectiveDate metadata");

      // Check performance timings
      assert(typeof data.performance.totalTimeMs === "number", "Total time ms present");
      assert(typeof data.performance.vectorSearchTimeMs === "number", "Vector search time ms present");

      // Security check: No raw vectors in response
      assert(!("vector" in topChunk), "Retrieved chunk must not expose vector");

      console.log("POST /api/retrieval/search with filters test passed");
    }

    // Test 3: POST /api/retrieval/search with queryVector only (no question text)
    {
      const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

      const res = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryVector: queryVec,
          topK: 2,
        }),
      });

      assert(res.status === 200, "Search with queryVector should return 200");
      const data = await res.json();

      assert(data.success === true, "Search with vector success should be true");
      assert(data.retrievedChunksCount === 2, "Top-K 2 returns exactly 2 chunks");
      assert(data.retrievedChunks[0].id.startsWith("doc_lithium"), "Most relevant is lithium chunk");

      console.log("POST /api/retrieval/search with queryVector only test passed");
    }

    // Test 4: POST /api/retrieval/search-detailed endpoint
    {
      const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

      const res = await fetch(`${baseUrl}/api/retrieval/search-detailed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryVector: queryVec,
          filters: { country: ["Germany"] },
        }),
      });

      assert(res.status === 200, "Detailed search endpoint should return 200");
      const data = await res.json();
      assert(data.retrievedChunksCount === 1, "Germany filter returns 1 chunk");
      assert(data.retrievedChunks[0].metadata.country === "Germany", "Country is Germany");

      console.log("POST /api/retrieval/search-detailed test passed");
    }

    // Test 5: POST /api/retrieval/vector-search direct endpoint
    {
      const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);

      const res = await fetch(`${baseUrl}/api/retrieval/vector-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryVector: queryVec,
          topK: 3,
        }),
      });

      assert(res.status === 200, "Vector-search endpoint should return 200");
      const data = await res.json();
      assert(data.success === true, "Vector-search success");
      assert(data.count === 3, "Returns 3 chunks");
      assert(data.retrievedChunks[0].rankingPosition === 1, "Rank 1 assigned");

      console.log("POST /api/retrieval/vector-search test passed");
    }

    // Test 6: Validation Middleware tests
    {
      // Missing both question and queryVector
      const emptyRes = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert(emptyRes.status === 400, "Empty payload should return 400 Bad Request");
      const emptyData = await emptyRes.json();
      assert(emptyData.success === false, "Error response success is false");
      assert(emptyData.error.includes("Either 'question'/'query'"), "Error message descriptive");

      // Invalid queryVector (non-numbers)
      const invalidVecRes = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryVector: ["not", "numbers"] }),
      });
      assert(invalidVecRes.status === 400, "Invalid queryVector should return 400");

      // Invalid topK
      const invalidTopKRes = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "valid question", topK: -5 }),
      });
      assert(invalidTopKRes.status === 400, "Negative topK should return 400");

      // Invalid filters (not an array)
      const invalidFilterRes = await fetch(`${baseUrl}/api/retrieval/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "valid question", filters: { country: "Germany" } }),
      });
      assert(invalidFilterRes.status === 400, "Non-array filter should return 400");

      console.log("Validation middleware tests passed");
    }

    console.log("All Retrieval Pipeline API integration tests passed successfully!");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

runApiTests().catch((error) => {
  console.error("Retrieval API test failed:", error);
  process.exitCode = 1;
});
