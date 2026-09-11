import { Request, Response, NextFunction } from "express";

/**
 * Applies security headers to HTTP responses to protect against common web vulnerabilities.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by forbidding embedding in frames
  res.setHeader("X-Frame-Options", "DENY");

  // Legacy XSS filter protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer information leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser permissions
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Basic Content-Security-Policy to restrict execution
  res.setHeader("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none';");

  // HSTS (HTTP Strict Transport Security) in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}
