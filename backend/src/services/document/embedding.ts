import { EmbeddingConfig } from "../../config/rag.config";
import { DocumentChunk, Embedding } from "../../types/document";

export interface EmbeddingClient {
  embed(inputs: string[]): Promise<number[][]>;
}

export interface EmbeddingWorkflow {
  prepare(chunks: DocumentChunk[]): string[];
  generate(chunks: DocumentChunk[]): Promise<Embedding[]>;
}

export interface EmbeddingQualityReport {
  sameTextSimilarity: number;
  similarPairSimilarity: number;
  dissimilarPairSimilarity: number;
  dimensions: number;
  passed: boolean;
  checks: string[];
}

type OpenAIEmbeddingItem = {
  embedding?: number[];
  index?: number;
};

type OpenAIEmbeddingResponse = {
  data?: OpenAIEmbeddingItem[];
  model?: string;
};

function assertNonEmptyTexts(texts: string[]): void {
  if (texts.length === 0) {
    throw new Error("At least one text is required to generate embeddings");
  }

  for (const text of texts) {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Embedding input text must be a non-empty string");
    }
  }
}

function assertValidVector(vector: number[] | undefined, expectedLength?: number): asserts vector is number[] {
  if (!vector || vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding response contained invalid vectors");
  }
  if (expectedLength !== undefined && vector.length !== expectedLength) {
    throw new Error(`Embedding dimension mismatch: expected ${expectedLength}, received ${vector.length}`);
  }
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function resolveDimensionsPayload(): number | undefined {
  return process.env.EMBEDDING_DIMENSIONS
    ? EmbeddingConfig.dimensions
    : undefined;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    throw new Error("Cosine similarity requires two non-empty vectors of equal length");
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    throw new Error("Cosine similarity is undefined for zero vectors");
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function evaluateEmbeddingQuality(samples: {
  sameTextA: number[];
  sameTextB: number[];
  similarA: number[];
  similarB: number[];
  dissimilarA: number[];
  dissimilarB: number[];
}): EmbeddingQualityReport {
  const sameTextSimilarity = cosineSimilarity(samples.sameTextA, samples.sameTextB);
  const similarPairSimilarity = cosineSimilarity(samples.similarA, samples.similarB);
  const dissimilarPairSimilarity = cosineSimilarity(samples.dissimilarA, samples.dissimilarB);
  const dimensions = samples.sameTextA.length;
  const checks: string[] = [];

  const sameTextOk = sameTextSimilarity > 0.99;
  checks.push(
    sameTextOk
      ? `Same-text cosine similarity is high (${sameTextSimilarity.toFixed(4)})`
      : `Same-text cosine similarity is too low (${sameTextSimilarity.toFixed(4)})`
  );

  const dimensionsOk =
    samples.sameTextB.length === dimensions &&
    samples.similarA.length === dimensions &&
    samples.similarB.length === dimensions &&
    samples.dissimilarA.length === dimensions &&
    samples.dissimilarB.length === dimensions;
  checks.push(
    dimensionsOk
      ? `All sample vectors share ${dimensions} dimensions`
      : "Sample vectors do not share a consistent dimension count"
  );

  const rankingOk = similarPairSimilarity > dissimilarPairSimilarity;
  checks.push(
    rankingOk
      ? `Similar fixture pair (${similarPairSimilarity.toFixed(4)}) outranks dissimilar pair (${dissimilarPairSimilarity.toFixed(4)})`
      : `Similar fixture pair (${similarPairSimilarity.toFixed(4)}) did not outrank dissimilar pair (${dissimilarPairSimilarity.toFixed(4)})`
  );

  const marginOk = similarPairSimilarity - dissimilarPairSimilarity >= 0.08;
  checks.push(
    marginOk
      ? `Semantic margin is sufficient (${(similarPairSimilarity - dissimilarPairSimilarity).toFixed(4)})`
      : `Semantic margin is too small (${(similarPairSimilarity - dissimilarPairSimilarity).toFixed(4)})`
  );

  return {
    sameTextSimilarity,
    similarPairSimilarity,
    dissimilarPairSimilarity,
    dimensions,
    passed: sameTextOk && dimensionsOk && rankingOk && marginOk,
    checks,
  };
}

function generateFallbackVector(text: string, dimensions = 128): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) % dimensions;
    }
    vec[Math.abs(hash)] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function createOpenAICompatibleClient(options: {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  batchSize?: number;
} = {}): EmbeddingClient {
  const endpoint = options.endpoint || EmbeddingConfig.apiEndpoint;
  const apiKey = options.apiKey || EmbeddingConfig.apiKey;
  const model = options.model || EmbeddingConfig.model;
  const timeoutMs = options.timeoutMs || EmbeddingConfig.timeoutMs;
  const batchSize = options.batchSize || EmbeddingConfig.batchSize;
  const dimensions = resolveDimensionsPayload();

  return {
    async embed(inputs) {
      assertNonEmptyTexts(inputs);

      if (!apiKey) {
        return inputs.map((t) => generateFallbackVector(t, dimensions || 128));
      }

      const vectors: number[][] = [];
      for (const batch of chunkArray(inputs, batchSize)) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        let response: Response;
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              input: batch,
              model,
              ...(dimensions ? { dimensions } : {}),
            }),
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Embedding request timed out after ${timeoutMs}ms`);
          }
          throw error;
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          throw new Error(`Embedding request failed with status ${response.status}`);
        }

        const payload = await response.json() as OpenAIEmbeddingResponse;
        const items = [...(payload.data ?? [])].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
        if (items.length !== batch.length) {
          throw new Error("Embedding service returned a different number of vectors than inputs");
        }

        for (const item of items) {
          assertValidVector(item.embedding);
          vectors.push(item.embedding);
        }
      }

      return vectors;
    },
  };
}

export function createEmbeddingWorkflow(client: EmbeddingClient): EmbeddingWorkflow {
  return {
    prepare: (chunks) => chunks.map((chunk) => chunk.content),
    async generate(chunks) {
      const texts = chunks.map((chunk) => chunk.content);
      const vectors = await generateEmbeddings(texts, client);
      return chunks.map((chunk, index) => ({
        chunkId: chunk.id,
        vector: vectors[index],
        embeddingModel: EmbeddingConfig.model,
      }));
    },
  };
}

export async function generateEmbeddings(
  texts: string[],
  client: EmbeddingClient = createOpenAICompatibleClient()
): Promise<number[][]> {
  assertNonEmptyTexts(texts);
  const vectors = await client.embed(texts);
  if (vectors.length !== texts.length) {
    throw new Error("Embedding service returned a different number of vectors than inputs");
  }
  vectors.forEach((vector) => assertValidVector(vector));
  return vectors;
}

export async function generateEmbedding(
  text: string,
  client: EmbeddingClient = createOpenAICompatibleClient()
): Promise<number[]> {
  const [vector] = await generateEmbeddings([text], client);
  return vector;
}

export async function embedChunks(
  chunks: DocumentChunk[],
  client: EmbeddingClient = createOpenAICompatibleClient()
): Promise<Embedding[]> {
  if (chunks.length === 0) {
    return [];
  }
  return createEmbeddingWorkflow(client).generate(chunks);
}

export function getEmbeddingModel(): string {
  return EmbeddingConfig.model;
}
