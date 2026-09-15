import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

/**
 * Global Express error handling middleware.
 * Ensures consistent JSON responses, stable machine-readable error codes,
 * and never leaks stack traces or internal secrets to clients.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError
    ? err.statusCode
    : res.statusCode >= 400
    ? res.statusCode
    : 500;

  const errorCode = isAppError
    ? err.code
    : statusCode === 400
    ? "VALIDATION_ERROR"
    : statusCode === 401
    ? "AUTHENTICATION_REQUIRED"
    : statusCode === 403
    ? "FORBIDDEN"
    : statusCode === 404
    ? "NOT_FOUND"
    : statusCode === 409
    ? "CONFLICT"
    : statusCode === 429
    ? "RATE_LIMITED"
    : statusCode >= 500
    ? "INTERNAL_SERVER_ERROR"
    : "ERROR";

  // Always log full error server-side
  console.error(`[API Error ${statusCode}][${errorCode}]:`, err.message);

  // In production, mask unhandled 500 errors to prevent secret/path leakage
  let message = err.message || "An unexpected internal server error occurred";
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected internal server error occurred. Please contact system support.";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    errorDetails: {
      code: errorCode,
      message,
      ...(isAppError && err.details ? { details: err.details } : {}),
    },
  });
}
