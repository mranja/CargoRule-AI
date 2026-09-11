import { Request, Response, NextFunction } from "express";

/**
 * Global Express error handling middleware.
 * Ensures consistent JSON responses and never leaks stack traces or internal secrets.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  // Always log full error server-side
  console.error(`[API Error ${statusCode}]:`, err.message);

  // In production, mask unhandled 500 errors to prevent secret/path leakage
  let message = err.message || "An unexpected internal server error occurred";
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected internal server error occurred. Please contact system support.";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
