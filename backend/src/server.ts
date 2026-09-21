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
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,https://cargo-rule-ai.vercel.app")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function isOriginAllowed(origin?: string): boolean {
  // Allow requests with no origin (like mobile apps, curl, server-to-server)
  if (!origin) return true;
  if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) return true;
  // Automatically allow localhost and 127.0.0.1 with any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Automatically allow Vercel production and preview domains
  if (origin === "https://cargo-rule-ai.vercel.app" || /^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key", "X-Demo-Role", "X-User-Id"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));


// 3. Global Request Limiter & JSON Body Parser
app.use(globalApiLimiter);
app.use(express.json({ limit: "15mb" }));

// Root health check endpoint (minimal disclosure)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "cargorule-backend" });
});

// Mount all API routes under /api and also / as fallback
app.use("/api", apiRouter);
app.use("/", apiRouter);

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
