import { EmbeddingConfig } from "../src/config/rag.config";
import {
  cosineSimilarity,
  createEmbeddingWorkflow,
  createOpenAICompatibleClient,
  embedChunks,
  evaluateEmbeddingQuality,
  generateEmbedding,
  generateEmbeddings,
  getEmbeddingModel,
} from "../src/services/document/embedding";
import { DocumentChunk } from "../src/types/document";
import {
  FIXTURE_LITHIUM_DOCS,
  FIXTURE_LITHIUM_QUERY,
  FIXTURE_LITHIUM_RELATED,
  FIXTURE_SOURCE,
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

function createFixtureChunk(id: string, content: string): DocumentChunk {
  return {
    id,
    documentId: "test_doc_embeddings",
    content,
    chunkIndex: 0,
    metadata: {
      documentName: "Embedding Test Fixture",
      documentType: "Test",
    },
  };
}

async function testCosineSimilarity(): Promise<void> {
  const similarity = cosineSimilarity([1, 0], [1, 0]);
  assert(Math.abs(similarity - 1) < 1e-9, "Identical vectors should have cosine similarity 1");

  const orthogonal = cosineSimilarity([1, 0], [0, 1]);
  assert(Math.abs(orthogonal) < 1e-9, "Orthogonal vectors should have cosine similarity 0");

  let threw = false;
  try {
    cosineSimilarity([1], [1, 2]);
  } catch {
    threw = true;
  }
  assert(threw, "Cosine similarity should reject mismatched dimensions");
  console.log("Cosine similarity unit test passed");
}

async function testGenerateEmbeddingWithMockClient(): Promise<void> {
  const client = {
    async embed(inputs: string[]) {
      return inputs.map((text) => tokenVector(text));
    },
  };

  const vector = await generateEmbedding(FIXTURE_LITHIUM_DOCS, client);
  assert(vector.length === FIXTURE_VOCAB.length, "Mock embedding should match the fixture vocabulary size");
  assert(vector.every(Number.isFinite), "Mock embedding values should be finite");

  const batch = await generateEmbeddings([FIXTURE_LITHIUM_DOCS, FIXTURE_UNRELATED_WAREHOUSE], client);
  assert(batch.length === 2, "Batch embedding should return one vector per input");

  const chunks = [
    createFixtureChunk("test_doc_embeddings_0", FIXTURE_LITHIUM_DOCS),
    createFixtureChunk("test_doc_embeddings_1", FIXTURE_LITHIUM_QUERY),
  ];
  const embeddings = await embedChunks(chunks, client);
  assert(embeddings.length === 2, "embedChunks should return one embedding per chunk");
  assert(embeddings[0].chunkId === chunks[0].id, "Embedding chunkId should match the source chunk");
  assert(embeddings[0].embeddingModel === getEmbeddingModel(), "Embedding model should come from config");

  const workflow = createEmbeddingWorkflow(client);
  const prepared = workflow.prepare(chunks);
  assert(prepared[0] === FIXTURE_LITHIUM_DOCS, "Workflow prepare should use chunk content");

  let emptyRejected = false;
  try {
    await generateEmbedding("   ", client);
  } catch {
    emptyRejected = true;
  }
  assert(emptyRejected, "Empty text should be rejected");

  console.log("Mock embedding generation test passed", { fixtureSource: FIXTURE_SOURCE });
}

async function testOpenAICompatibleClientContract(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url: String(input), body });
    return new Response(
      JSON.stringify({
        data: [
          { index: 1, embedding: [0, 1] },
          { index: 0, embedding: [1, 0] },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const client = createOpenAICompatibleClient({
      endpoint: "https://example.test/v1/embeddings",
      apiKey: "test-key",
      model: "test-model",
    });
    const vectors = await client.embed(["alpha", "beta"]);
    assert(vectors[0][0] === 1 && vectors[1][1] === 1, "Client should restore OpenAI item order by index");
    assert(requests[0].url === "https://example.test/v1/embeddings", "Client should POST to the configured endpoint");
    assert(requests[0].body.model === "test-model", "Client should send the configured model");
    console.log("OpenAI-compatible client contract test passed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testQualityEvaluationWithFixtures(): Promise<void> {
  const sameA = tokenVector(FIXTURE_LITHIUM_DOCS);
  const sameB = tokenVector(FIXTURE_LITHIUM_DOCS);
  const similarA = tokenVector(FIXTURE_LITHIUM_DOCS);
  const similarB = tokenVector(FIXTURE_LITHIUM_RELATED);
  const dissimilarA = tokenVector(FIXTURE_LITHIUM_DOCS);
  const dissimilarB = tokenVector(FIXTURE_UNRELATED_WAREHOUSE);

  const report = evaluateEmbeddingQuality({
    sameTextA: sameA,
    sameTextB: sameB,
    similarA,
    similarB,
    dissimilarA,
    dissimilarB,
  });

  assert(report.passed, `Fixture quality evaluation failed: ${report.checks.join("; ")}`);
  console.log("Embedding quality evaluation (local fixture vectors) passed", report);
}

async function testLiveEmbeddingsIfConfigured(): Promise<void> {
  if (!EmbeddingConfig.apiKey) {
    console.log("Skipping live embedding API evaluation (OPENAI_API_KEY is not set)");
    return;
  }

  const sameA = await generateEmbedding(FIXTURE_LITHIUM_DOCS);
  const sameB = await generateEmbedding(FIXTURE_LITHIUM_DOCS);
  const similarB = await generateEmbedding(FIXTURE_LITHIUM_RELATED);
  const dissimilarB = await generateEmbedding(FIXTURE_UNRELATED_WAREHOUSE);

  const report = evaluateEmbeddingQuality({
    sameTextA: sameA,
    sameTextB: sameB,
    similarA: sameA,
    similarB,
    dissimilarA: sameA,
    dissimilarB,
  });

  console.log("Live embedding quality report", {
    model: getEmbeddingModel(),
    endpoint: EmbeddingConfig.apiEndpoint,
    dimensions: report.dimensions,
    sameTextSimilarity: report.sameTextSimilarity,
    similarPairSimilarity: report.similarPairSimilarity,
    dissimilarPairSimilarity: report.dissimilarPairSimilarity,
    checks: report.checks,
  });

  assert(report.passed, `Live embedding quality evaluation failed: ${report.checks.join("; ")}`);
  console.log("Live embedding API evaluation passed");
}

async function main(): Promise<void> {
  await testCosineSimilarity();
  await testGenerateEmbeddingWithMockClient();
  await testOpenAICompatibleClientContract();
  await testQualityEvaluationWithFixtures();
  await testLiveEmbeddingsIfConfigured();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
