import crypto from "crypto";

export interface AuthUser {
  userId: string;
  email: string;
  role: "admin" | "user";
}

export interface TokenPayload extends AuthUser {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "cargorule-ai-default-dev-secret-key-change-in-production";
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

export interface StoredUser {
  id: string;
  name?: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: "admin" | "user";
  createdAt: string;
}

export class AuthService {
  private static users = new Map<string, StoredUser>();
  private static initialized = false;

  private static initializeDefaultUsers(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Seed enterprise administrator
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@cargorule.ai").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const { hash, salt } = this.hashPassword(adminPassword);

    const adminUser: StoredUser = {
      id: "admin-user-001",
      name: "Compliance Administrator",
      email: adminEmail,
      passwordHash: hash,
      salt,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminEmail, adminUser);
  }

  /**
   * Hashes a password using PBKDF2 with SHA-512.
   */
  public static hashPassword(
    password: string,
    salt = crypto.randomBytes(16).toString("hex")
  ): { hash: string; salt: string } {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return { hash, salt };
  }

  /**
   * Verifies a plain text password against a stored PBKDF2 hash using timing-safe comparison.
   */
  public static verifyPassword(password: string, storedHash: string, salt: string): boolean {
    try {
      const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
      const a = Buffer.from(computedHash, "hex");
      const b = Buffer.from(storedHash, "hex");
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Registers a new user with hashed password.
   */
  public static registerUser(details: {
    email: string;
    password: string;
    name?: string;
    role?: "admin" | "user";
  }): StoredUser {
    this.initializeDefaultUsers();
    const email = details.email.toLowerCase().trim();

    if (this.users.has(email)) {
      throw new Error("An account with this email address already exists");
    }

    const { hash, salt } = this.hashPassword(details.password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newUser: StoredUser = {
      id: userId,
      name: details.name || email.split("@")[0],
      email,
      passwordHash: hash,
      salt,
      role: details.role || "user",
      createdAt: new Date().toISOString(),
    };

    this.users.set(email, newUser);
    return newUser;
  }

  /**
   * Authenticates user with email and password.
   */
  public static authenticate(email: string, password: string): AuthUser | null {
    this.initializeDefaultUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const stored = this.users.get(normalizedEmail);

    if (!stored) {
      return null;
    }

    const isValid = this.verifyPassword(password, stored.passwordHash, stored.salt);
    if (!isValid) {
      return null;
    }

    return {
      userId: stored.id,
      email: stored.email,
      role: stored.role,
    };
  }

  public static findUserByEmail(email: string): StoredUser | null {
    this.initializeDefaultUsers();
    return this.users.get(email.toLowerCase().trim()) || null;
  }

  public static findUserById(userId: string): StoredUser | null {
    this.initializeDefaultUsers();
    for (const user of this.users.values()) {
      if (user.id === userId) return user;
    }
    return null;
  }

  /**
   * Generates a signed, URL-safe HMAC-SHA256 authentication token.
   */
  public static generateToken(user: AuthUser, expiresInSeconds = TOKEN_EXPIRY_SECONDS): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      ...user,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    return `${header}.${body}.${signature}`;
  }

  /**
   * Verifies and decodes a signed authentication token.
   * Returns null if the token is expired, malformed, or has an invalid signature.
   */
  public static verifyToken(token: string): AuthUser | null {
    if (!token || typeof token !== "string") return null;

    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    // Verify signature using timing-safe comparison to prevent timing attacks
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    // Decode and validate payload
    try {
      const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      if (!payload.userId || !payload.role) {
        return null; // Invalid payload
      }

      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  /**
   * Returns fallback admin user for system operations if needed.
   */
  public static getDemoUser(role: "admin" | "user" = "user"): AuthUser {
    this.initializeDefaultUsers();
    if (role === "admin") {
      const admin = this.users.get((process.env.ADMIN_EMAIL || "admin@cargorule.ai").toLowerCase().trim());
      if (admin) {
        return {
          userId: admin.id,
          email: admin.email,
          role: "admin",
        };
      }
    }
    return {
      userId: "user-default-001",
      email: "user@cargorule.ai",
      role: "user",
    };
  }
}
