import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";

const router = Router();

router.get("/dashboard/stats", StatsController.getDashboardStats);
router.get("/coverage/countries", StatsController.getCountries);
router.get("/coverage/carriers", StatsController.getCarriers);

export default router;
