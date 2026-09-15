import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";
import { optionalAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard/stats", optionalAuth, StatsController.getDashboardStats);
router.get("/coverage/countries", optionalAuth, StatsController.getCountries);
router.get("/coverage/carriers", optionalAuth, StatsController.getCarriers);
router.get("/admin/stats", requireAdmin, StatsController.getAdminStats);
router.get("/admin/dashboard", requireAdmin, StatsController.getAdminDashboard);
router.get("/admin/activity", requireAdmin, StatsController.getAdminActivity);
router.get("/admin/health", requireAdmin, StatsController.getAdminHealth);
router.get("/admin/queries", requireAdmin, StatsController.getAdminQueries);

export default router;
