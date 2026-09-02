import { Router } from "express";
import { RAGController } from "../controllers/rag.controller";

const router = Router();

router.post("/ask", RAGController.ask);
router.post("/query", RAGController.ask);

export default router;
