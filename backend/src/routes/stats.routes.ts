import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";
import { optionalAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard/stats", optionalAuth, StatsController.getDashboardStats);
router.get("/coverage/countries", optionalAuth, StatsController.getCountries);
router.get("/coverage/carriers", optionalAuth, StatsController.getCarriers);
router.get("/admin/stats", requireAdmin, StatsController.getAdminStats);

export default router;
