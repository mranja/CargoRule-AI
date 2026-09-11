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

export class AuthService {
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
   * Returns demo users for hackathon/production convenience.
   */
  public static getDemoUser(role: "admin" | "user" = "user"): AuthUser {
    if (role === "admin") {
      return {
        userId: "admin-user-001",
        email: "admin@cargorule.ai",
        role: "admin",
      };
    }
    return {
      userId: "ops-user-001",
      email: "ops@cargorule.ai",
      role: "user",
    };
  }
}
