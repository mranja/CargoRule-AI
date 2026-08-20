import { EmbeddingConfig } from "../../config/rag.config";
import { DocumentChunk, Embedding } from "../../types/document";

export interface EmbeddingClient {
  embed(inputs: string[]): Promise<number[][]>;
}

export interface EmbeddingWorkflow {
  prepare(chunks: DocumentChunk[]): string[];
  generate(chunks: DocumentChunk[]): Promise<Embedding[]>;
}

export function createEmbeddingWorkflow(client: EmbeddingClient): EmbeddingWorkflow {
  return {
    prepare: (chunks) => chunks.map((chunk) => chunk.content),
    async generate(chunks) {
      const vectors = await client.embed(chunks.map((chunk) => chunk.content));
      if (vectors.length !== chunks.length) {
        throw new Error("Embedding service returned a different number of vectors than inputs");
      }
      return chunks.map((chunk, index) => ({
        chunkId: chunk.id,
        vector: vectors[index],
        embeddingModel: EmbeddingConfig.model,
      }));
    },
  };
}

export function createOpenAICompatibleClient(options: {
  endpoint?: string;
  apiKey?: string;
  model?: string;
} = {}): EmbeddingClient {
  const endpoint = options.endpoint || EmbeddingConfig.apiEndpoint;
  const apiKey = options.apiKey || EmbeddingConfig.apiKey;
  const model = options.model || EmbeddingConfig.model;

  return {
    async embed(inputs) {
      if (!apiKey) throw new Error("Embedding API key is not configured");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ input: inputs, model }),
      });
      if (!response.ok) throw new Error(`Embedding request failed with status ${response.status}`);
      const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
      const vectors = payload.data?.map((item) => item.embedding);
      if (!vectors || vectors.some((vector) => !vector)) throw new Error("Embedding response contained invalid vectors");
      return vectors as number[][];
    },
  };
}