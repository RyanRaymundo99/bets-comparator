import { NextRequest } from "next/server";
import prisma from "./prisma";
import { validateSession, type ValidatedSession } from "./session";
import { unauthorizedResponse, forbiddenResponse } from "./api-response";
import { logger } from "./logger";

/**
 * Get session from request or return null
 */
export async function getSession(
  request: NextRequest
): Promise<ValidatedSession | null> {
  return validateSession(request);
}

/**
 * Require authentication - returns session or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<ValidatedSession | Response> {
  const session = await getSession(request);
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }
  return session;
}

/**
 * Require admin role - returns session or error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<ValidatedSession | Response> {
  const session = await requireAuth(request);
  if (session instanceof Response) return session;

  if (session.user.role !== "ADMIN") {
    return forbiddenResponse("Admin access required");
  }

  return session;
}

/**
 * Get user ID from session or return null
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getSession(request);
  return session?.userId || null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const session = await getSession(request);
  return session?.user.role === "ADMIN" || false;
}

/**
 * Get session token from request cookies
 */
export function getSessionToken(request: NextRequest): string | null {
  return request.cookies.get("better-auth.session")?.value || null;
}

/**
 * Verify admin session (for API routes that need admin check)
 */
export async function verifyAdminSession(
  request: NextRequest
): Promise<{ valid: boolean; user?: unknown; error?: string }> {
  try {
    const sessionToken = getSessionToken(request);

    if (!sessionToken) {
      return { valid: false, error: "No session token" };
    }

    const session = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session?.user) {
      return { valid: false, error: "Invalid session" };
    }

    if (session.user.role !== "ADMIN") {
      return { valid: false, error: "Not an admin user" };
    }

    return {
      valid: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    };
  } catch (error) {
    logger.error("Session verification error", error);
    return { valid: false, error: "Session verification failed" };
  }
}

