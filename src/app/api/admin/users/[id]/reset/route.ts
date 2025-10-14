import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Reset user approval status to pending
    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: "PENDING",
        emailVerified: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User status reset to pending successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Error resetting user status:", error);
    return NextResponse.json(
      { error: "Failed to reset user status" },
      { status: 500 }
    );
  }
}
