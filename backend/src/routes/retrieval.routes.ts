import { Router } from "express";
import { RetrievalController } from "../controllers/retrieval.controller";
import {
  validateRetrievalRequest,
  validateVectorSearchRequest,
} from "../middleware/validateRetrievalRequest";

const router = Router();

// Vector similarity search with metadata filtering
router.post("/search", validateRetrievalRequest, RetrievalController.search);

// Alias for search with full detailed metadata
router.post("/search-detailed", validateRetrievalRequest, RetrievalController.search);

// Direct vector search endpoint
router.post("/vector-search", validateVectorSearchRequest, RetrievalController.searchVector);

// Retrieval service health & statistics
router.get("/health", RetrievalController.getHealth);

export default router;
