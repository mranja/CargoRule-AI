import { Request, Response } from "express";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";

export class HistoryController {
  public static list(req: Request, res: Response): void {
    try {
      const user = req.user;
      // If user is admin and requests ?all=true, return all queries; otherwise filter by authenticated user
      const seeAll = user?.role === "admin" && req.query.all === "true";
      const targetUserId = seeAll ? undefined : (user?.userId || (req.headers["x-user-id"] as string | undefined));

      const history = queryHistoryStore.getAll(targetUserId);
      res.status(200).json({
        success: true,
        count: history.length,
        queries: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to retrieve query history",
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

      const user = req.user;
      const query = queryHistoryStore.getById(id.trim());
      if (!query) {
        res.status(404).json({ success: false, error: "Query record not found" });
        return;
      }

      // IDOR Authorization check: Users can only see their own queries, Admins can view any query
      if (user && user.role !== "admin" && query.userId && query.userId !== user.userId) {
        res.status(403).json({
          success: false,
          error: "Unauthorized: You do not have permission to access this query record",
        });
        return;
      }

      res.status(200).json({ success: true, query });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to get query record",
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

      const user = req.user;
      const query = queryHistoryStore.getById(id.trim());
      if (!query) {
        res.status(404).json({ success: false, error: "Query record not found" });
        return;
      }

      // IDOR Authorization check: Only creator or admin can delete
      if (user && user.role !== "admin" && query.userId && query.userId !== user.userId) {
        res.status(403).json({
          success: false,
          error: "Unauthorized: You do not have permission to delete this query record",
        });
        return;
      }

      const deleted = queryHistoryStore.deleteById(id.trim());
      if (!deleted) {
        res.status(404).json({ success: false, error: "Query record not found" });
        return;
      }

      res.status(200).json({ success: true, message: "Query record deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete query record",
      });
    }
  }

  public static clear(req: Request, res: Response): void {
    try {
      const user = req.user;
      // Only admin can clear all history; regular users only clear their own history
      if (!user) {
        const headerUserId = req.headers["x-user-id"] as string | undefined;
        queryHistoryStore.clear(headerUserId);
      } else if (user.role === "admin" && req.query.all === "true") {
        queryHistoryStore.clear(undefined); // Clear all
      } else {
        queryHistoryStore.clear(user.userId); // Clear user's own queries
      }

      res.status(200).json({ success: true, message: "Query history cleared" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to clear history",
      });
    }
  }
}
