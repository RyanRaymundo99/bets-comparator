import { NextRequest, NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/two-factor";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 }
      );
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
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "2FA token is required" },
        { status: 400 }
      );
    }

    // Validate token format
    if (!TwoFactorService.isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Check if user has a temporary secret
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA setup not initiated. Please start setup first." },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 400 });
    }

    // Enable 2FA and activate the account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        approvalStatus: "PENDING", // Require admin approval after 2FA setup
        kycStatus: "PENDING", // Require KYC submission
      },
    });

    // Create a permanent session (replace temporary one)
    const permanentSessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Delete the temporary session
    await prisma.session.delete({
      where: { id: session.id },
    });

    // Create permanent session
    await prisma.session.create({
      data: {
        id: permanentSessionId,
        token: permanentSessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Set the permanent session cookie
    const response = NextResponse.json({
      success: true,
      message: "Account activated! 2FA has been successfully enabled.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        approvalStatus: "APPROVED",
        twoFactorEnabled: true,
      },
    });

    // Set the permanent session cookie
    response.cookies.set("better-auth.session", permanentSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("2FA signup completion error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete account setup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
