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

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Verify the 2FA token
    const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 400 });
    }

    // Generate new backup codes
    const newBackupCodes = TwoFactorService.regenerateBackupCodes();

    // Update user with new backup codes
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorBackupCodes: newBackupCodes,
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
      message: "New backup codes generated successfully",
    });
  } catch (error) {
    console.error("Backup codes generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate new backup codes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled for this account" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      backupCodes: user.twoFactorBackupCodes,
      remainingCodes: user.twoFactorBackupCodes.length,
    });
  } catch (error) {
    console.error("Get backup codes error:", error);
    return NextResponse.json(
      {
        error: "Failed to get backup codes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

