import { Request, Response, NextFunction } from "express";
import { AuthService, AuthUser } from "../services/auth/auth.service";

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "cargorule-admin-secure-api-key-2026";

/**
 * Extracts and verifies token or API key from request headers.
 */
function extractUserFromRequest(req: Request): AuthUser | null {
  // 1. Check API Key header
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && apiKey === ADMIN_API_KEY) {
    return {
      userId: "api-key-admin",
      email: "admin-api@cargorule.ai",
      role: "admin",
    };
  }

  // 2. Check Authorization Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return AuthService.verifyToken(token);
  }

  // 3. Check custom header for demo/hackathon environment if explicitly configured
  const demoRole = req.headers["x-demo-role"] as string | undefined;
  if (process.env.NODE_ENV !== "production" && demoRole && (demoRole === "admin" || demoRole === "user")) {
    return AuthService.getDemoUser(demoRole);
  }

  return null;
}

/**
 * Middleware that extracts user if valid token exists, otherwise leaves req.user undefined.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
}

/**
 * Middleware requiring a valid authenticated user. Rejects with 401 if unauthenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please provide a valid Bearer token in the Authorization header.",
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware requiring admin role. Rejects with 401 if unauthenticated or 403 if not admin.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please provide a valid Bearer token.",
    });
    return;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Access denied. Administrative privileges are required for this resource.",
    });
    return;
  }

  req.user = user;
  next();
}
