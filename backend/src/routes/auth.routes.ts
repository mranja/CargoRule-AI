import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authLoginLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", authLoginLimiter, AuthController.login);
router.post("/register", authLoginLimiter, AuthController.register);
router.get("/me", requireAuth, AuthController.me);

export default router;
