import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number; // e.g. 60000 (1 minute)
  maxRequests: number; // e.g. 30 requests
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates an in-memory sliding-window rate limiting middleware.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, RateLimitRecord>();
  const {
    windowMs,
    maxRequests,
    message = "Too many requests. Please slow down and try again later.",
    keyGenerator = (req: Request) => {
      // Prioritize authenticated user ID, otherwise IP
      const userId = req.user?.userId;
      if (userId) return `user_${userId}`;
      const ip =
        req.ip ||
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown_ip";
      return `ip_${ip}`;
    },
  } = options;

  // Cleanup old records every 2 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.max(1, resetTimeSeconds)));

    if (currentCount >= maxRequests) {
      res.setHeader("Retry-After", String(Math.max(1, resetTimeSeconds)));
      res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.max(1, resetTimeSeconds),
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured limiters for different risk profiles
export const ragQueryLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 queries per minute
  message: "Query rate limit exceeded (max 30 requests per minute). Please try again shortly.",
});

export const retrievalSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: "Retrieval search rate limit exceeded (max 60 requests per minute).",
});

export const documentUploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Document upload rate limit exceeded (max 10 uploads per minute).",
});

export const authLoginLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many authentication attempts. Please try again in 1 minute.",
});

export const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 180,
  message: "API rate limit exceeded. Please reduce request velocity.",
});
