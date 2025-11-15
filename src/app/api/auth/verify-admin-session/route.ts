import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("better-auth.session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ valid: false, error: "No session token" });
    }

    // Verify session and check if user is admin
    const session = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session?.user) {
      return NextResponse.json({
        valid: false,
        error: "Invalid session",
      });
    }

    // Check if user has ADMIN role (instead of hardcoded ID)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({
        valid: false,
        error: "Not an admin user",
      });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json({
      valid: false,
      error: "Session verification failed",
    });
  }
}
