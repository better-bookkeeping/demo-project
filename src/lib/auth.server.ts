import crypto from "node:crypto";
import { redirect } from "@tanstack/react-router";
import { getCookie, setCookie, deleteCookie, getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { sessionCookieName } from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";
import { csrfMiddleware } from "./csrf.server";
import { rateLimitMiddleware } from "./rate-limit.server";
import { z } from "zod";

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? (() => {
  if (process.env.NODE_ENV === "production" || process.env.ENVIRONMENT === "production") {
    throw new Error("COOKIE_SECRET environment variable must be set in production");
  }
  return "dev-secret-change-in-production";
})();
const BCRYPT_SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$/.test(value);
}

// DEPRECATED: Plaintext password migration path. This exists solely to migrate
// legacy accounts that were created before bcrypt was introduced. Once all
// accounts have been migrated (check: SELECT count(*) FROM "User" WHERE password
// NOT LIKE '$2%'), remove the plaintext branch entirely.
async function verifyAndMigratePassword(
  userId: string,
  storedPassword: string,
  inputPassword: string,
): Promise<boolean> {
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  if (storedPassword !== inputPassword) return false;

  const prisma = await getServerSidePrismaClient();
  const hashedPassword = await bcrypt.hash(inputPassword, BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

  return true;
}

function signSessionId(sessionId: string): string {
  const signature = crypto.createHmac("sha256", COOKIE_SECRET).update(sessionId).digest("hex");
  return `${sessionId}.${signature}`;
}

function verifySessionToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const sessionId = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);
  if (!sessionId || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", COOKIE_SECRET).update(sessionId).digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  return sessionId;
}

async function setSessionCookie(userId: string) {
  const prisma = await getServerSidePrismaClient();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const ip = getRequestIP({ xForwardedFor: true });
  const ua = getRequestHeader("user-agent");

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      ipAddress: ip ?? null,
      userAgent: ua ?? null,
    },
  });

  const token = signSessionId(session.id);

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });
}

async function cleanExpiredSessions() {
  if (Math.random() > 0.01) return; // ~1 in 100 calls
  const prisma = await getServerSidePrismaClient();
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export const getUserServerFn = createServerFn().handler(async () => {
  const sessionToken = getCookie(sessionCookieName);
  if (!sessionToken) {
    return null;
  }

  const sessionId = verifySessionToken(sessionToken);
  if (!sessionId) {
    return null;
  }

  const prisma = await getServerSidePrismaClient();
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, email: true, name: true, createdAt: true, updatedAt: true, calorieGoal: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
    deleteCookie(sessionCookieName);
    return null;
  }

  cleanExpiredSessions().catch(() => {});

  return session.user;
});

const authRateLimit = rateLimitMiddleware({ maxAttempts: 10, windowMs: 15 * 60 * 1000 });

export const signInServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authRateLimit])
  .inputValidator(z.object({ email: z.string().email(), password: z.string().max(128) }))
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    const { email, password } = data;

    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false as const, error: "Invalid email or password" };
    }

    const isValid = await verifyAndMigratePassword(user.id, user.password, password);
    if (!isValid) {
      return { success: false as const, error: "Invalid email or password" };
    }

    await setSessionCookie(user.id);

    return { success: true as const };
  });

export const createAccountServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authRateLimit])
  .inputValidator(z.object({ email: z.email(), name: z.string().min(1), password: z.string().min(8).max(128) }))
  .handler(async ({ data }: { data: { email: string; name: string; password: string } }) => {
    const { email, name, password } = data;

    const prisma = await getServerSidePrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false as const, error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    await setSessionCookie(user.id);

    return { success: true as const };
  });

export const logoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware])
  .handler(async () => {
    const sessionToken = getCookie(sessionCookieName);
    if (sessionToken) {
      const sessionId = verifySessionToken(sessionToken);
      if (sessionId) {
        const prisma = await getServerSidePrismaClient();
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      }
    }
    deleteCookie(sessionCookieName);
    return { success: true };
  });

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await getUserServerFn();
  if (!user) {
    throw redirect({ to: "/sign-in" });
  }

  return next({
    context: { user },
  });
});

export const getActiveSessionsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const sessions = await prisma.session.findMany({
      where: { userId: context.user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, ipAddress: true, userAgent: true, expiresAt: true },
    });
    return sessions;
  });

export const getCurrentSessionIdServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const sessionToken = getCookie(sessionCookieName);
    if (!sessionToken) return null;
    return verifySessionToken(sessionToken);
  });

export const revokeSessionServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { sessionId: string } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.session.deleteMany({
      where: { id: data.sessionId, userId: context.user.id },
    });
    return { success: true };
  });
