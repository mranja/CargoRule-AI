import { Request, Response } from "express";
import { documentStore } from "../services/document/documentStore";
import { queryHistoryStore } from "../services/rag/queryHistoryStore";

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
        const country = d.country || "Global";
        map.set(country, (map.get(country) ?? 0) + 1);
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
}
