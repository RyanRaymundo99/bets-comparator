import { NextRequest } from "next/server";
import prisma from "./prisma";
import { logger } from "./logger";

export interface ValidatedSession {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  sessionId: string;
}

export async function validateSession(
  request: NextRequest
): Promise<ValidatedSession | null> {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return null;
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      });
      return null;
    }

    // Check if user exists and is approved
    if (!session.user) {
      return null;
    }

    return {
      userId: session.user.id,
      user: session.user,
      sessionId: session.id,
    };
  } catch (error) {
    logger.error("Session validation error", error);
    return null;
  }
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  try {
    // Extend session by 7 days
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    logger.error("Session refresh error", error);
    return false;
  }
}
