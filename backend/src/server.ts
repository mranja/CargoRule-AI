import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { securityHeaders } from "./middleware/securityHeaders";
import { globalApiLimiter } from "./middleware/rateLimiter";
import apiRouter from "./routes";

export const app = express();

// 1. Security Headers
app.use(securityHeaders);

// 2. Strict CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' not allowed by policy`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key", "X-Demo-Role", "X-User-Id"],
    maxAge: 86400, // 24 hours
  })
);

// 3. Global Request Limiter & JSON Body Parser
app.use(globalApiLimiter);
app.use(express.json({ limit: "15mb" }));

// Root health check endpoint (minimal disclosure)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "cargorule-backend" });
});

// Mount all API routes under /api
app.use("/api", apiRouter);

// Global error handling middleware
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || "3001", 10);

if (require.main === module) {
  // Initialize default document store data
  import("./services/document/documentStore").then(({ documentStore }) => {
    documentStore.initialize().catch((err) => {
      console.warn("Failed to initialize document store:", err);
    });
  });

  app.listen(PORT, () => {
    console.log(`CargoRule AI backend listening on port ${PORT}`);
  });
}

export default app;
