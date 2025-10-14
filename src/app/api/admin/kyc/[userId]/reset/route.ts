import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    // Reset user KYC status to pending
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "PENDING",
        kycReviewedAt: null,
        kycRejectionReason: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC status reset to pending successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error("Error resetting KYC status:", error);
    return NextResponse.json(
      { error: "Failed to reset KYC status" },
      { status: 500 }
    );
  }
}
