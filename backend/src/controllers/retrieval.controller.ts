import { Request, Response, NextFunction } from "express";
import { EmbeddingConfig, VectorDatabaseConfig } from "../config/rag.config";
import {
  getDefaultVectorStore,
  retrieveForQuery,
  retrieveRelevantChunks,
} from "../services/retrieval";
import { RetrievalApiRequest, RetrievalResponse } from "../types/retrieval";

/**
 * Controller handling retrieval pipeline API requests.
 */
export class RetrievalController {
  /**
   * POST /api/retrieval/search
   *
   * Executes vector similarity search with metadata filtering for a text question or query vector.
   * Returns retrieved chunks, rich metadata, relevance scores, and retrieval metrics.
   */
  public static async search(
    req: Request<unknown, unknown, RetrievalApiRequest>,
    res: Response<RetrievalResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        question,
        query,
        queryVector,
        filters,
        topK,
        parameters,
        correlationId,
      } = req.body;

      const queryString = (question || query || "").trim();
      const mergedParameters = {
        ...parameters,
        ...(topK !== undefined ? { topK } : {}),
      };

      const result = await retrieveForQuery({
        question: queryString,
        queryVector,
        filters,
        parameters: mergedParameters,
        correlationId,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/retrieval/vector-search
   *
   * Direct vector search endpoint accepting a pre-computed query vector.
   */
  public static async searchVector(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { queryVector, filters, topK } = req.body;
      const chunks = await retrieveRelevantChunks(queryVector, filters, topK);

      res.status(200).json({
        success: true,
        retrievedChunks: chunks,
        count: chunks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/retrieval/health
   *
   * Health and readiness endpoint for the retrieval pipeline.
   */
  public static async getHealth(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const vectorStore = getDefaultVectorStore();
      const indexedChunks = await vectorStore.count();

      res.status(200).json({
        status: "healthy",
        service: "retrieval-pipeline",
        indexedChunks,
        model: EmbeddingConfig.model,
        dimensions: EmbeddingConfig.dimensions,
        provider: VectorDatabaseConfig.provider,
        indexName: VectorDatabaseConfig.indexName,
      });
    } catch (error) {
      next(error);
    }
  }
}
