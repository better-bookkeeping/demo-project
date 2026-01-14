import { redirect } from "@tanstack/react-router";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { accessTokenCookieName, idTokenCookieName } from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";

const LOG_CONTEXT = {
  AUTH_CALLBACK: "[Auth Callback]",
  TOKEN_PARSE: "[Token Parse]",
  USERINFO_FETCH: "[UserInfo Fetch]",
  USER_UPSERT: "[User Upsert]",
  DRIVE_MANAGEMENT: "[Drive Management]",
  AUTH_MIDDLEWARE: "[Auth Middleware]",
} as const;

/**
 * Gets the current user from tokens and database
 * @note Returns null if not logged in (no redirect)
 * @throws Will log and return null if authentication or database operations fail
 */
export const getUserServerFn = createServerFn().handler(async () => {
  const accessToken = getCookie(accessTokenCookieName);
  if (!accessToken) {
    return null;
  }

  const idToken = getCookie(idTokenCookieName);
  // Get user info from ID token or Auth0 API

  const prisma = await getServerSidePrismaClient();

  const user = await prisma.user.findUnique({
    where: {
      email: idToken,
      currentToken: accessToken,
      tokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) {
    console.error(`${LOG_CONTEXT.AUTH_MIDDLEWARE} User not found or token is expired`);
    return null;
  }
  return user;
});

/**
 * Authentication middleware that ensures user is logged in
 * @throws Redirects to sign-in page if not authenticated
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await getUserServerFn();
  if (!user) {
    console.warn(`${LOG_CONTEXT.AUTH_MIDDLEWARE} User not authenticated, redirecting to sign-in`);
    throw redirect({ to: "/sign-in" });
  }

  return next({
    context: { user },
  });
});

export function generateAuthToken(email: string) {
  // Generate token for immediate login
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expiresAt };
}
