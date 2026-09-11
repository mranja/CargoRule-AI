import { Router } from "express";
import retrievalRoutes from "./retrieval.routes";
import ragRoutes from "./rag.routes";
import documentRoutes from "./document.routes";
import historyRoutes from "./history.routes";
import statsRoutes from "./stats.routes";
import authRoutes from "./auth.routes";
import { RAGController } from "../controllers/rag.controller";

const apiRouter = Router();

// Minimal health check
apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "cargorule-backend" });
});

// Authentication endpoints
apiRouter.use("/auth", authRoutes);

// Primary RAG query endpoints
apiRouter.use("/rag", ragRoutes);
apiRouter.post("/ask", RAGController.ask);
apiRouter.post("/query", RAGController.ask);

// Retrieval pipeline & vector search
apiRouter.use("/retrieval", retrievalRoutes);

// Document management & ingestion
apiRouter.use("/documents", documentRoutes);

// Query history audit logs
apiRouter.use("/history", historyRoutes);

// Metrics, coverage, and dashboard stats
apiRouter.use("/", statsRoutes);

export default apiRouter;
