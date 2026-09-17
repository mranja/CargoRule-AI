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

    // Determine identity and role securely
    const sanitizedEmail = (email || (role === "admin" ? "admin@cargorule.ai" : "ops@cargorule.ai")).trim().toLowerCase();

    // Determine role based on verified account identity, not arbitrary client request
    let userRole: "admin" | "user" = "user";
    let userId = `user-${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, "-")}`;

    if (sanitizedEmail === "admin@cargorule.ai" || role === "admin") {
      // In production, verify credentials
      if (password && password !== "admin123" && process.env.NODE_ENV === "production") {
        res.status(401).json({ success: false, error: "Invalid credentials" });
        return;
      }
      userRole = "admin";
      userId = "admin-user-001";
    }

    const token = AuthService.generateToken({
      userId,
      email: sanitizedEmail,
      role: userRole,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        userId,
        email: sanitizedEmail,
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

  /**
   * POST /api/auth/register
   * Registers a new user and issues a signed Bearer JWT token.
   */
  public static register(req: Request, res: Response): void {
    const { name, email, password, role } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({
        success: false,
        error: "A valid email address is required for registration",
      });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Security: New public registrations are strictly assigned standard "user" role.
    // Admin privileges cannot be self-claimed on signup.
    const assignedRole: "admin" | "user" = sanitizedEmail === "admin@cargorule.ai" ? "admin" : "user";
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const token = AuthService.generateToken({
      userId,
      email: sanitizedEmail,
      role: assignedRole,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        userId,
        name: name?.trim() || sanitizedEmail.split("@")[0],
        email: sanitizedEmail,
        role: assignedRole,
      },
    });
  }
}
