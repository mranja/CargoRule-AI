import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import apiRouter from "./routes";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Root health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "cargorule-backend" });
});

// Mount all API routes under /api
app.use("/api", apiRouter);

// Global error handling middleware
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || "3001", 10);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CargoRule AI backend listening on port ${PORT}`);
  });
}

export default app;
