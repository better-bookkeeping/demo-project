import crypto from "node:crypto";
import { hash, verify } from "argon2";
import { redirect } from "@tanstack/react-router";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { sessionCookieName } from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "./rate-limit.server";
import { z } from "zod";

// Cookie secret must be set in production
function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("COOKIE_SECRET environment variable is required in production");
  }
  return secret || "dev-secret-change-in-production";
}

const COOKIE_SECRET = getCookieSecret();

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a tamper-proof session token with embedded expiry
 * Token format: userId.expiresAt.signature
 */
function createSessionToken(userId: string, expiresAt: Date): string {
  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);
  const payload = `${userId}.${expiresAtUnix}`;
  const signature = crypto.createHmac("sha256", COOKIE_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token and returns the user ID if valid and not expired
 * Uses timing-safe comparison to prevent timing attacks
 */
function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAtStr, signature] = parts;
  if (!userId || !expiresAtStr || !signature) return null;

  // Verify signature
  const payload = `${userId}.${expiresAtStr}`;
  const expectedSignature = crypto.createHmac("sha256", COOKIE_SECRET).update(payload).digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  // Verify expiry
  const expiresAt = parseInt(expiresAtStr, 10) * 1000;
  if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

  return userId;
}

/**
 * Sets the session cookie for a user (internal use only)
 */
function setSessionCookie(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = createSessionToken(userId, expiresAt);

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });
}

/**
 * Gets the current user from session cookie
 * @returns User object or null if not logged in
 */
export const getUserServerFn = createServerFn().handler(async () => {
  const sessionToken = getCookie(sessionCookieName);
  if (!sessionToken) {
    return null;
  }

  const userId = verifySessionToken(sessionToken);
  if (!userId) {
    return null;
  }

  const prisma = await getServerSidePrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
});

/**
 * Signs in a user with email and password
 * Rate limited: 5 failed attempts triggers 15-minute lockout
 */
export const signInServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string() }))
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    const { email, password } = data;

    // Check rate limit before processing
    const rateLimitResult = await checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60000);
      return {
        success: false as const,
        error: `Too many login attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      };
    }

    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Record failed attempt even for non-existent users (prevents enumeration)
      await recordFailedAttempt(email);
      return { success: false as const, error: "Invalid email or password" };
    }

    const isValidPassword = await verify(user.password, password);
    if (!isValidPassword) {
      const result = await recordFailedAttempt(email);
      if (result.locked) {
        return {
          success: false as const,
          error: "Too many login attempts. Please try again in 15 minutes.",
        };
      }
      return { success: false as const, error: "Invalid email or password" };
    }

    // Successful login - reset attempts
    await resetAttempts(email);
    setSessionCookie(user.id);

    return { success: true as const };
  });

/**
 * Creates a new user account
 */
export const createAccountServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.email(), name: z.string().trim().min(1), password: z.string().min(6) }))
  .handler(async ({ data }: { data: { email: string; name: string; password: string } }) => {
    const { email, name, password } = data;

    const prisma = await getServerSidePrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false as const, error: "Unable to create account. Please try again." };
    }

    const hashedPassword = await hash(password);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    setSessionCookie(user.id);

    return { success: true as const };
  });

/**
 * Logs out the current user
 */
export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(sessionCookieName);
  return { success: true };
});

/**
 * Authentication middleware that ensures user is logged in
 * @throws Redirects to sign-in page if not authenticated
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await getUserServerFn();
  if (!user) {
    throw redirect({ to: "/sign-in" });
  }

  return next({
    context: { user },
  });
});

/**
 * Updates the current user's name
 */
export const updateUserNameServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().trim().min(1).max(100) }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { name: string } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.user.update({
      where: { id: context.user.id },
      data: { name: data.name },
    });
    return { success: true };
  });
