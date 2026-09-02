import { Request, Response } from "express";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";

export class HistoryController {
  public static list(_req: Request, res: Response): void {
    try {
      const history = queryHistoryStore.getAll();
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
      const query = queryHistoryStore.getById(id);
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

  public static clear(_req: Request, res: Response): void {
    try {
      queryHistoryStore.clear();
      res.status(200).json({ success: true, message: "Query history cleared" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear history",
      });
    }
  }
}
