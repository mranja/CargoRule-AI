import { Router } from "express";
import retrievalRoutes from "./retrieval.routes";

const apiRouter = Router();

apiRouter.use("/retrieval", retrievalRoutes);

export default apiRouter;
