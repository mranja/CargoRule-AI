import { Router } from "express";
import { RAGController } from "../controllers/rag.controller";
import { optionalAuth } from "../middleware/auth.middleware";
import { ragQueryLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/ask", optionalAuth, ragQueryLimiter, RAGController.ask);
router.post("/query", optionalAuth, ragQueryLimiter, RAGController.ask);

export default router;
