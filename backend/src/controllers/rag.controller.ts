import { Request, Response } from "express";
import { executeRAG } from "../services/rag/answerGeneration";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";
import { normalizeCountry } from "../utils/country";
import { normalizeCarrier } from "../utils/carrier";

export class RAGController {
  public static async ask(req: Request, res: Response): Promise<void> {
    const { question, filters } = req.body as {
      question?: string;
      filters?: {
        country?: string;
        carrier?: string;
        documentType?: string;
      };
    };

    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({
        success: false,
        error: "Missing required field: question (non-empty string required)",
      });
      return;
    }

    if (question.trim().length > 1000) {
      res.status(400).json({
        success: false,
        error: "Question exceeds maximum allowed length of 1000 characters",
      });
      return;
    }

    const queryId = `query-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const userId = (req as any).userId || (req.headers["x-user-id"] as string | undefined);

    try {
      // Map filters if provided and not "all"
      const mappedFilters: Record<string, string[]> = {};
      const normalizedCountry = normalizeCountry(filters?.country);
      if (normalizedCountry) {
        mappedFilters.country = [normalizedCountry];
      }
      const normalizedCarrier = normalizeCarrier(filters?.carrier);
      if (normalizedCarrier) {
        mappedFilters.carrier = [normalizedCarrier];
      }
      if (filters?.documentType && filters.documentType.toLowerCase() !== "all") {
        mappedFilters.documentType = [filters.documentType];
      }

      const ragResult = await executeRAG({
        question: question.trim(),
        filters: Object.keys(mappedFilters).length > 0 ? mappedFilters : undefined,
      });

      // Format sources from retrieved chunks for rich frontend display
      const formattedSources = ragResult.retrievalResponse.retrievedChunks.map((chunk, index) => ({
        id: chunk.id || `src-${index}`,
        chunkId: chunk.id || `chunk-${index}`,
        documentId: chunk.documentId,
        documentName: chunk.metadata.documentName,
        documentTitle: chunk.metadata.documentName,
        section: chunk.metadata.section,
        pageNumber: chunk.metadata.pageNumber,
        country: chunk.metadata.country,
        carrier: chunk.metadata.carrier,
        documentType: chunk.metadata.documentType,
        snippet: chunk.content.length > 200 ? `${chunk.content.substring(0, 200)}...` : chunk.content,
        relevanceScore: chunk.relevanceScore,
      }));

      // Record in query history store
      queryHistoryStore.addQuery({
        id: queryId,
        userId,
        question: question.trim(),
        answer: ragResult.answer,
        country: normalizedCountry,
        carrier: normalizedCarrier,
        documentType: filters?.documentType,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        createdAt: now,
        status: "completed",
        sources: formattedSources,
        retrievedSources: formattedSources,
        confidenceScore: ragResult.context.confidenceScore,
        model: ragResult.model,
      });

      res.status(200).json({
        success: true,
        id: queryId,
        question: question.trim(),
        answer: ragResult.answer,
        sources: formattedSources,
        sourcesSummary: ragResult.sourcesSummary,
        confidenceScore: ragResult.context.confidenceScore,
        timestamp: now,
        filtersUsed: filters,
        model: ragResult.model,
      });
    } catch (error) {
      console.error("Error executing RAG query:", error);

      // Record failed query
      queryHistoryStore.addQuery({
        id: queryId,
        userId,
        question: question.trim(),
        answer: "Failed to process compliance query due to an internal error.",
        country: filters?.country || "Global",
        carrier: filters?.carrier || "All",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        createdAt: now,
        status: "failed",
        sources: [],
        errorMessage: error instanceof Error ? error.message : "Internal error",
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal error generating RAG answer",
      });
    }
  }
}
