import { Router } from "express";
import { RetrievalController } from "../controllers/retrieval.controller";
import {
  validateRetrievalRequest,
  validateVectorSearchRequest,
} from "../middleware/validateRetrievalRequest";
import { optionalAuth } from "../middleware/auth.middleware";
import { retrievalSearchLimiter } from "../middleware/rateLimiter";

const router = Router();

// Vector similarity search with metadata filtering (rate limited)
router.post(
  "/search",
  optionalAuth,
  retrievalSearchLimiter,
  validateRetrievalRequest,
  RetrievalController.search
);

// Alias for search with full detailed metadata
router.post(
  "/search-detailed",
  optionalAuth,
  retrievalSearchLimiter,
  validateRetrievalRequest,
  RetrievalController.search
);

// Direct vector search endpoint
router.post(
  "/vector-search",
  optionalAuth,
  retrievalSearchLimiter,
  validateVectorSearchRequest,
  RetrievalController.searchVector
);

// Retrieval service health & statistics (public minimal)
router.get("/health", RetrievalController.getHealth);

export default router;
