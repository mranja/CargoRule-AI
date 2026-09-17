import { Request, Response } from "express";
import { AuthService } from "../services/auth/auth.service";

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticates user credentials with password verification and returns signed Bearer JWT token.
   */
  public static login(req: Request, res: Response): void {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    const authUser = AuthService.authenticate(email, password);
    if (!authUser) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    const token = AuthService.generateToken(authUser);
    const stored = AuthService.findUserById(authUser.userId);

    res.status(200).json({
      success: true,
      token,
      user: {
        userId: authUser.userId,
        name: stored?.name || authUser.email.split("@")[0],
        email: authUser.email,
        role: authUser.role,
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

    const stored = AuthService.findUserById(req.user.userId);

    res.status(200).json({
      success: true,
      user: {
        userId: req.user.userId,
        name: stored?.name || req.user.email.split("@")[0],
        email: req.user.email,
        role: req.user.role,
      },
    });
  }

  /**
   * POST /api/auth/register
   * Registers a new user with salted password hash and issues a signed Bearer JWT token.
   */
  public static register(req: Request, res: Response): void {
    const { name, email, password } = req.body || {};

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

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const adminEmail = (process.env.ADMIN_EMAIL || "admin@cargorule.ai").toLowerCase().trim();
      const assignedRole: "admin" | "user" = sanitizedEmail === adminEmail ? "admin" : "user";

      const newUser = AuthService.registerUser({
        name: name?.trim() || sanitizedEmail.split("@")[0],
        email: sanitizedEmail,
        password: password.trim(),
        role: assignedRole,
      });

      const token = AuthService.generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  }
}
