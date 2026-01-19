import { getServerSidePrismaClient } from "./db.server";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Check if login is rate limited for the given email
 */
export async function checkRateLimit(email: string): Promise<RateLimitResult> {
  const prisma = await getServerSidePrismaClient();
  const normalizedEmail = email.toLowerCase();

  const record = await prisma.loginAttempt.findUnique({
    where: { email: normalizedEmail },
  });

  if (!record) {
    return { allowed: true };
  }

  // Check if currently locked
  if (record.lockedAt) {
    const lockExpiry = record.lockedAt.getTime() + LOCKOUT_DURATION_MS;
    const now = Date.now();

    if (now < lockExpiry) {
      return { allowed: false, retryAfterMs: lockExpiry - now };
    }
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt and return whether the account is now locked
 */
export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; retryAfterMs?: number }> {
  const prisma = await getServerSidePrismaClient();
  const normalizedEmail = email.toLowerCase();

  // Upsert the record - increment attempts or reset if lock expired
  const record = await prisma.loginAttempt.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      attempts: 1,
    },
    update: {
      attempts: {
        increment: 1,
      },
    },
  });

  // Check if we should lock
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { email: normalizedEmail },
      data: { lockedAt: new Date() },
    });
    return { locked: true, retryAfterMs: LOCKOUT_DURATION_MS };
  }

  return { locked: false };
}

/**
 * Reset login attempts on successful login
 */
export async function resetAttempts(email: string): Promise<void> {
  const prisma = await getServerSidePrismaClient();
  const normalizedEmail = email.toLowerCase();

  await prisma.loginAttempt.deleteMany({
    where: { email: normalizedEmail },
  });
}
