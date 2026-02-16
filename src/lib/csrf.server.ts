import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader, getRequestHost } from "@tanstack/react-start/server";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export const csrfMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const origin = getRequestHeader("origin");
  const referer = getRequestHeader("referer");
  const host = getRequestHost();

  // Allow requests with no origin (same-origin GET-like, server-side calls)
  if (!origin && !referer) {
    return next();
  }

  const requestHost = origin ? extractHost(origin) : referer ? extractHost(referer) : null;

  if (!requestHost || requestHost !== host) {
    throw new Error("CSRF validation failed");
  }

  return next();
});
