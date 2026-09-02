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
  const message = err.message || "An unexpected internal server error occurred";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
