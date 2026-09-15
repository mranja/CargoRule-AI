import { Request, Response } from "express";
import { documentStore } from "../services/document/documentStore";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";
import { AdminStatsService } from "../services/admin/adminStats.service";

export class StatsController {
  public static getDashboardStats(_req: Request, res: Response): void {
    try {
      const docStats = documentStore.getStats();
      const queriesCount = queryHistoryStore.getCount();

      const kpi = [
        {
          id: "total_documents",
          label: "Active Documents",
          value: String(docStats.indexedDocuments),
          subtext: `${docStats.totalChunks} indexed chunks`,
          iconName: "documents",
        },
        {
          id: "compliance_queries",
          label: "Queries Processed",
          value: String(queriesCount),
          subtext: "100% citation-grounded",
          iconName: "history",
        },
        {
          id: "countries_covered",
          label: "Countries Covered",
          value: String(docStats.countriesCount || 1),
          subtext: "Global customs regulations",
          iconName: "countries",
        },
        {
          id: "carriers_supported",
          label: "Carriers Supported",
          value: String(docStats.carriersCount || 1),
          subtext: "Express & freight policies",
          iconName: "carriers",
        },
      ];

      res.status(200).json({
        success: true,
        stats: docStats,
        kpi,
        recentDocuments: documentStore.getAllDocuments().slice(0, 5),
        recentQueries: queryHistoryStore.getAll().slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get stats",
      });
    }
  }

  public static getCountries(_req: Request, res: Response): void {
    try {
      const docs = documentStore.getAllDocuments().filter((d) => d.status === "indexed");
      const map = new Map<string, number>();

      for (const d of docs) {
        if (d.country) {
          map.set(d.country, (map.get(d.country) ?? 0) + 1);
        }
      }

      const countries = Array.from(map.entries()).map(([country, count]) => ({
        country,
        count,
      }));

      res.status(200).json({
        success: true,
        count: countries.length,
        countries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get countries",
      });
    }
  }

  public static getCarriers(_req: Request, res: Response): void {
    try {
      const docs = documentStore.getAllDocuments().filter((d) => d.status === "indexed");
      const map = new Map<string, number>();

      for (const d of docs) {
        const carrier = d.carrier || "All";
        map.set(carrier, (map.get(carrier) ?? 0) + 1);
      }

      const carriers = Array.from(map.entries()).map(([carrier, count]) => ({
        carrier,
        count,
      }));

      res.status(200).json({
        success: true,
        count: carriers.length,
        carriers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get carriers",
      });
    }
  }

  public static async getAdminStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminStatsService.getAdminDashboardStats();
      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get admin statistics",
      });
    }
  }

  public static async getAdminDashboard(req: Request, res: Response): Promise<void> {
    return StatsController.getAdminStats(req, res);
  }

  public static async getAdminActivity(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminStatsService.getAdminDashboardStats();
      res.status(200).json({
        success: true,
        activity: stats.activityFeed,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get admin activity",
      });
    }
  }

  public static async getAdminHealth(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminStatsService.getAdminDashboardStats();
      res.status(200).json({
        success: true,
        health: stats.subsystemHealth,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get admin health",
      });
    }
  }

  public static getAdminQueries(req: Request, res: Response): void {
    try {
      const { search, country, carrier } = req.query;
      let queries = queryHistoryStore.getAll();

      if (typeof search === "string" && search.trim()) {
        const q = search.toLowerCase().trim();
        queries = queries.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            (item.answer && item.answer.toLowerCase().includes(q))
        );
      }

      if (typeof country === "string" && country !== "all") {
        queries = queries.filter(
          (item) => item.country && item.country.toLowerCase() === country.toLowerCase()
        );
      }

      if (typeof carrier === "string" && carrier !== "all") {
        queries = queries.filter(
          (item) => item.carrier && item.carrier.toLowerCase() === carrier.toLowerCase()
        );
      }

      res.status(200).json({
        success: true,
        count: queries.length,
        queries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get admin queries",
      });
    }
  }
}
