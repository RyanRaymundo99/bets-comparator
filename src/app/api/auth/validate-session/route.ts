import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json({
        authenticated: false,
        message: "No session cookie found",
      });
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: { user: true },
    });

    if (session && session.expiresAt > new Date()) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        sessionId: session.id,
        expiresAt: session.expiresAt,
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        message: session ? "Session expired" : "Invalid session",
      });
    }
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Failed to validate session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
