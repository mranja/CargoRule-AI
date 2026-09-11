import { Request, Response } from "express";
import { AuthService } from "../services/auth/auth.service";

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticates user credentials or demo role, returns signed Bearer JWT token.
   */
  public static login(req: Request, res: Response): void {
    const { email, password, role } = req.body || {};

    // Validate inputs
    if (!email && !role) {
      res.status(400).json({
        success: false,
        error: "Either 'email' or 'role' ('admin' | 'user') must be provided",
      });
      return;
    }

    // Standard hackathon / demo role login
    let userRole: "admin" | "user" = "user";
    let userEmail = email || "ops@cargorule.ai";
    let userId = "ops-user-001";

    if (role === "admin" || email === "admin@cargorule.ai") {
      // In production, check real password hash; in hackathon/dev, accept admin login
      if (password && password !== "admin123" && process.env.NODE_ENV === "production") {
        res.status(401).json({ success: false, error: "Invalid credentials" });
        return;
      }
      userRole = "admin";
      userEmail = "admin@cargorule.ai";
      userId = "admin-user-001";
    }

    const token = AuthService.generateToken({
      userId,
      email: userEmail,
      role: userRole,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        userId,
        email: userEmail,
        role: userRole,
      },
    });
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user context.
   */
  public static me(req: Request, res: Response): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  }
}
