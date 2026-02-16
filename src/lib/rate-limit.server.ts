import { createMiddleware } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries periodically (every 100 checks, fixed window)
let checkCount = 0;
function maybeCleanStore() {
  checkCount++;
  if (checkCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function rateLimitMiddleware(opts: { maxAttempts: number; windowMs: number }) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const ip = getRequestIP({ xForwardedFor: true });
    if (!ip) {
      throw new Error("Unable to determine client IP address");
    }
    const now = Date.now();

    maybeCleanStore();

    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > opts.maxAttempts) {
      throw new Error("Too many attempts. Please try again later.");
    }

    return next();
  });
}
