import { EmbeddingConfig } from "../src/config/rag.config";
import { cosineSimilarity } from "../src/services/document/embedding";
import {
  generateQueryEmbedding,
  generateQueryEmbeddings,
  getQueryEmbeddingDimensions,
  getQueryEmbeddingModel,
  prepareQueryText,
} from "../src/services/query/queryEmbedding";
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

async function testPrepareQueryText(): Promise<void> {
  const cleaned = prepareQueryText("  What are the \n\n customs rules for   lithium \t batteries?  ");
  assert(
    cleaned === "What are the customs rules for lithium batteries?",
    "prepareQueryText should normalize excess whitespace and line breaks"
  );

  let emptyRejected = false;
  try {
    prepareQueryText("   \n\t  ");
  } catch {
    emptyRejected = true;
  }
  assert(emptyRejected, "prepareQueryText should reject whitespace-only strings");

  let nonStringRejected = false;
  try {
    // @ts-expect-error testing invalid type
    prepareQueryText(12345);
  } catch {
    nonStringRejected = true;
  }
  assert(nonStringRejected, "prepareQueryText should reject non-string inputs");

  console.log("prepareQueryText validation tests passed");
}

async function testGenerateQueryEmbedding(): Promise<void> {
  const mockClient = {
    async embed(inputs: string[]) {
      return inputs.map((text) => tokenVector(text));
    },
  };

  const vector = await generateQueryEmbedding(FIXTURE_LITHIUM_QUERY, mockClient);
  assert(Array.isArray(vector), "generateQueryEmbedding should return an array");
  assert(vector.length === FIXTURE_VOCAB.length, "Embedding vector length should match expected vocabulary");
  assert(vector.every(Number.isFinite), "All embedding values must be finite numbers");

  console.log("generateQueryEmbedding unit tests passed");
}

async function testGenerateQueryEmbeddingsBatch(): Promise<void> {
  const mockClient = {
    async embed(inputs: string[]) {
      return inputs.map((text) => tokenVector(text));
    },
  };

  const queries = [
    FIXTURE_LITHIUM_QUERY,
    "TEST FIXTURE: How to handle dry goods warehouse logs?",
  ];

  const vectors = await generateQueryEmbeddings(queries, mockClient);
  assert(vectors.length === 2, "Batch query embedding should return one vector per query");
  assert(vectors[0].length === FIXTURE_VOCAB.length, "First vector length matches vocabulary");
  assert(vectors[1].length === FIXTURE_VOCAB.length, "Second vector length matches vocabulary");

  let emptyBatchRejected = false;
  try {
    await generateQueryEmbeddings([], mockClient);
  } catch {
    emptyBatchRejected = true;
  }
  assert(emptyBatchRejected, "Batch query embedding should reject empty queries array");

  console.log("generateQueryEmbeddings batch tests passed");
}

async function testConfigAndModelConsistency(): Promise<void> {
  const model = getQueryEmbeddingModel();
  const dimensions = getQueryEmbeddingDimensions();

  assert(model === EmbeddingConfig.model, "Query embedding model must match EmbeddingConfig.model");
  assert(dimensions === EmbeddingConfig.dimensions, "Query embedding dimensions must match EmbeddingConfig.dimensions");

  console.log("Config and model consistency tests passed", { model, dimensions });
}

async function testQueryDocumentSemanticSimilarity(): Promise<void> {
  const queryVec = tokenVector(FIXTURE_LITHIUM_QUERY);
  const relevantDocVec = tokenVector(FIXTURE_LITHIUM_DOCS);
  const unrelatedDocVec = tokenVector(FIXTURE_UNRELATED_WAREHOUSE);

  const relevantSim = cosineSimilarity(queryVec, relevantDocVec);
  const unrelatedSim = cosineSimilarity(queryVec, unrelatedDocVec);

  assert(
    relevantSim > unrelatedSim,
    `Relevant doc similarity (${relevantSim.toFixed(4)}) should be higher than unrelated doc (${unrelatedSim.toFixed(4)})`
  );
  assert(
    relevantSim - unrelatedSim > 0.05,
    "Query should have a clear semantic margin towards relevant documents"
  );

  console.log("Query-to-document semantic similarity test passed", {
    queryText: FIXTURE_LITHIUM_QUERY,
    relevantSimilarity: relevantSim.toFixed(4),
    unrelatedSimilarity: unrelatedSim.toFixed(4),
    margin: (relevantSim - unrelatedSim).toFixed(4),
  });
}

async function testLiveQueryEmbeddingIfConfigured(): Promise<void> {
  if (!EmbeddingConfig.apiKey) {
    console.log("Skipping live query embedding test (OPENAI_API_KEY is not set)");
    return;
  }

  const queryVector = await generateQueryEmbedding(FIXTURE_LITHIUM_QUERY);
  assert(Array.isArray(queryVector), "Live query embedding should return an array");
  assert(queryVector.length === EmbeddingConfig.dimensions, "Live query vector dimension must match config");

  console.log("Live query embedding test passed", {
    dimensions: queryVector.length,
    model: getQueryEmbeddingModel(),
  });
}

async function main(): Promise<void> {
  await testPrepareQueryText();
  await testGenerateQueryEmbedding();
  await testGenerateQueryEmbeddingsBatch();
  await testConfigAndModelConsistency();
  await testQueryDocumentSemanticSimilarity();
  await testLiveQueryEmbeddingIfConfigured();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
