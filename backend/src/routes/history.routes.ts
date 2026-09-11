import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", optionalAuth, HistoryController.list);
router.get("/:id", optionalAuth, HistoryController.getById);
router.delete("/:id", optionalAuth, HistoryController.delete);
router.delete("/", optionalAuth, HistoryController.clear);

export default router;
