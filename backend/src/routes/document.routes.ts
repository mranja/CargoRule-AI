import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { optionalAuth, requireAdmin } from "../middleware/auth.middleware";
import { documentUploadLimiter } from "../middleware/rateLimiter";

const router = Router();

// Read operations: Accessible with optional user context
router.get("/", optionalAuth, DocumentController.list);
router.get("/:id", optionalAuth, DocumentController.getById);

// Administrative / Mutation operations: Strictly require admin role + rate limited
router.post("/", requireAdmin, documentUploadLimiter, DocumentController.upload);
router.post("/upload", requireAdmin, documentUploadLimiter, DocumentController.upload);
router.patch("/:id", requireAdmin, DocumentController.update);
router.put("/:id", requireAdmin, DocumentController.update);
router.delete("/:id", requireAdmin, DocumentController.delete);

export default router;
