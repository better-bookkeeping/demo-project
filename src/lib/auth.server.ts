import crypto from "node:crypto";
import argon2 from "argon2";
import { redirect } from "@tanstack/react-router";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { sessionCookieName } from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";
import { checkRateLimit } from "./rate-limiter";
import { passwordSchema } from "./password-validation";
import { z } from "zod";

// Environment variables - set via .env.local or Docker env_file
const APP_ENVIRONMENT = process.env.VITE_ENVIRONMENT || process.env.ENVIRONMENT || process.env.NODE_ENV;
const isProduction = APP_ENVIRONMENT === "production";
const COOKIE_SECRET = process.env.COOKIE_SECRET || (!isProduction ? "dev-cookie-secret" : undefined);
if (!COOKIE_SECRET) {
  throw new Error("COOKIE_SECRET is required in production");
}

/**
 * Signs a user ID to create a tamper-proof session token
 */
function signUserId(userId: string): string {
  const signature = crypto.createHmac("sha256", COOKIE_SECRET).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

/**
 * Verifies a signed session token and returns the user ID if valid
 */
function verifySessionToken(token: string): string | null {
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", COOKIE_SECRET).update(userId).digest("hex");
  if (signature !== expectedSignature) return null;

  return userId;
}

/**
 * Sets the session cookie for a user (internal use only)
 */
function setSessionCookie(userId: string) {
  const token = signUserId(userId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    secure: isProduction,
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
    select: { id: true, email: true, name: true },
  });

  return user;
});

/**
 * Signs in a user with email and password
 */
export const signInServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string() }))
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    checkRateLimit();
    const { email, password } = data;

    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { success: false as const, error: "Invalid email or password" };
    }

    const passwordMatch = await argon2.verify(user.passwordHash, password);
    if (!passwordMatch) {
      return { success: false as const, error: "Invalid email or password" };
    }

    setSessionCookie(user.id);

    return { success: true as const };
  });

/**
 * Creates a new user account
 */
export const createAccountServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.email(), name: z.string().min(1), password: passwordSchema }))
  .handler(async ({ data }: { data: { email: string; name: string; password: string } }) => {
    checkRateLimit();
    const { email, name, password } = data;

    const prisma = await getServerSidePrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false as const, error: "An account with this email already exists" };
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
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
 * Creates a test account for E2E testing
 * This is a simplified version that returns the user without setting session cookie
 */
export const createTestAccountServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), name: z.string().min(1), password: passwordSchema }))
  .handler(async ({ data }: { data: { email: string; name: string; password: string } }) => {
    if (APP_ENVIRONMENT !== "test" && process.env.NODE_ENV !== "test") {
      throw new Error("Test-only endpoint");
    }
    const { email, name, password } = data;

    const prisma = await getServerSidePrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false as const, error: "An account with this email already exists" };
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return { success: true as const, user };
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
