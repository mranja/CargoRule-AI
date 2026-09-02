import { Request, Response } from "express";
import { executeRAG } from "../services/rag/answerGeneration";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";

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

    const queryId = `query-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    try {
      // Map filters if provided and not "all"
      const mappedFilters: Record<string, string[]> = {};
      if (filters?.country && filters.country.toLowerCase() !== "all") {
        mappedFilters.country = [filters.country];
      }
      if (filters?.carrier && filters.carrier.toLowerCase() !== "all") {
        mappedFilters.carrier = [filters.carrier];
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
        documentTitle: chunk.metadata.documentName,
        section: chunk.metadata.section,
        pageNumber: chunk.metadata.pageNumber,
        country: chunk.metadata.country,
        carrier: chunk.metadata.carrier,
        snippet: chunk.content.length > 200 ? `${chunk.content.substring(0, 200)}...` : chunk.content,
        relevanceScore: chunk.relevanceScore,
      }));

      // Record in query history store
      queryHistoryStore.addQuery({
        id: queryId,
        question: question.trim(),
        answer: ragResult.answer,
        country: filters?.country || "Global",
        carrier: filters?.carrier || "All",
        documentType: filters?.documentType,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "completed",
        sources: formattedSources,
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
        question: question.trim(),
        answer: "Failed to process compliance query due to an internal error.",
        country: filters?.country || "Global",
        carrier: filters?.carrier || "All",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "failed",
        sources: [],
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal error generating RAG answer",
      });
    }
  }
}
