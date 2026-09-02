import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";

const router = Router();

router.get("/", DocumentController.list);
router.get("/:id", DocumentController.getById);
router.post("/", DocumentController.upload);
router.post("/upload", DocumentController.upload);
router.delete("/:id", DocumentController.delete);

export default router;
