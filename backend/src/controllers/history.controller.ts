import { Request, Response } from "express";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";

export class HistoryController {
  public static list(req: Request, res: Response): void {
    try {
      const userId = (req as any).userId || (req.headers["x-user-id"] as string | undefined);
      let history = queryHistoryStore.getAll(userId);

      const search = (req.query.q || req.query.search) as string | undefined;
      const country = req.query.country as string | undefined;
      const carrier = req.query.carrier as string | undefined;

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        history = history.filter(
          (item) =>
            item.question.toLowerCase().includes(term) ||
            item.answer.toLowerCase().includes(term)
        );
      }

      if (country && country.trim() && country.toLowerCase() !== "all") {
        const cTerm = country.trim().toLowerCase();
        history = history.filter(
          (item) => item.country && item.country.toLowerCase().includes(cTerm)
        );
      }

      if (carrier && carrier.trim() && carrier.toLowerCase() !== "all") {
        const carTerm = carrier.trim().toLowerCase();
        history = history.filter(
          (item) => item.carrier && item.carrier.toLowerCase().includes(carTerm)
        );
      }

      res.status(200).json({
        success: true,
        count: history.length,
        queries: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve history",
      });
    }
  }

  public static getById(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id || typeof id !== "string" || !id.trim()) {
        res.status(400).json({ success: false, error: "Valid query ID is required" });
        return;
      }
      const userId = (req as any).userId || (req.headers["x-user-id"] as string | undefined);
      const query = queryHistoryStore.getById(id.trim(), userId);
      if (!query) {
        res.status(404).json({ success: false, error: "Query record not found" });
        return;
      }
      res.status(200).json({ success: true, query });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get query record",
      });
    }
  }

  public static delete(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id || typeof id !== "string" || !id.trim()) {
        res.status(400).json({ success: false, error: "Valid query ID is required" });
        return;
      }
      const userId = (req as any).userId || (req.headers["x-user-id"] as string | undefined);
      const deleted = queryHistoryStore.deleteById(id.trim(), userId);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Query record not found or unauthorized" });
        return;
      }
      res.status(200).json({ success: true, message: "Query record deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete query record",
      });
    }
  }

  public static clear(req: Request, res: Response): void {
    try {
      const userId = (req as any).userId || (req.headers["x-user-id"] as string | undefined);
      queryHistoryStore.clear(userId);
      res.status(200).json({ success: true, message: "Query history cleared" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear history",
      });
    }
  }
}
