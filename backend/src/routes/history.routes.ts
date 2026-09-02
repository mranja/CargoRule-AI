import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";

const router = Router();

router.get("/", HistoryController.list);
router.get("/:id", HistoryController.getById);
router.delete("/", HistoryController.clear);

export default router;
