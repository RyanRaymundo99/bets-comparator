import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = session.user;

    return NextResponse.json({
      success: true,
      documents: {
        documentFront: user.documentFront,
        documentBack: user.documentBack,
        documentSelfie: user.documentSelfie,
      },
    });
  } catch (error) {
    console.error("Error fetching KYC documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC documents" },
      { status: 500 }
    );
  }
}
