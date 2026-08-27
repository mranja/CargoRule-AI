import { EmbeddingConfig } from "../../config/rag.config";
import {
  EmbeddingClient,
  generateEmbedding,
  generateEmbeddings,
  getEmbeddingModel,
} from "../document/embedding";

/**
 * Prepares and normalizes a user query before generating its embedding.
 *
 * Validates that the query is a non-empty string, trims whitespace,
 * and collapses consecutive internal whitespace without altering semantic meaning.
 *
 * @param query - Raw query text from user or API
 * @returns Cleaned and trimmed query string
 * @throws Error if query is empty or invalid
 */
export function prepareQueryText(query: string): string {
  if (typeof query !== "string") {
    throw new Error("Query must be a string");
  }

  const cleaned = query
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    throw new Error("Query text must not be empty");
  }

  return cleaned;
}

/**
 * Generates an embedding vector for a single user query.
 *
 * Reuses the existing OpenAI-compatible embedding pipeline to ensure
 * model and dimensional consistency with indexed document chunks.
 *
 * @param query - The user search query or question
 * @param client - Optional custom or mock embedding client
 * @returns Dense vector representation of the query
 */
export async function generateQueryEmbedding(
  query: string,
  client?: EmbeddingClient
): Promise<number[]> {
  const preparedQuery = prepareQueryText(query);
  return generateEmbedding(preparedQuery, client);
}

/**
 * Generates embedding vectors for multiple queries in batch.
 *
 * @param queries - Array of user search queries
 * @param client - Optional custom or mock embedding client
 * @returns Array of dense vectors corresponding to input queries
 */
export async function generateQueryEmbeddings(
  queries: string[],
  client?: EmbeddingClient
): Promise<number[][]> {
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error("At least one query is required for batch embedding");
  }

  const preparedQueries = queries.map(prepareQueryText);
  return generateEmbeddings(preparedQueries, client);
}

/**
 * Retrieves the currently configured embedding model for query embeddings.
 */
export function getQueryEmbeddingModel(): string {
  return getEmbeddingModel();
}

/**
 * Retrieves the expected dimensionality for query embeddings.
 */
export function getQueryEmbeddingDimensions(): number {
  return EmbeddingConfig.dimensions;
}
