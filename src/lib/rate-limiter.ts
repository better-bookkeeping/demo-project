import { getRequest } from "@tanstack/react-start/server";

const attempts = new Map<string, { count: number; resetAt: number }>();

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function checkRateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000): void {
  const appEnvironment = process.env.VITE_ENVIRONMENT || process.env.ENVIRONMENT || process.env.NODE_ENV || "development";
  if (appEnvironment !== "production") {
    return;
  }

  const request = getRequest();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "unknown";

  if (ip === "::1" || ip === "localhost") {
    return;
  }

  const key = `auth:${ip}`;
  const now = Date.now();

  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    if (entry) attempts.delete(key);
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= maxAttempts) {
    throw new RateLimitError("Too many requests. Try again later.");
  }

  entry.count++;
}
