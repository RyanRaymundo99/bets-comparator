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

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled for this account" },
        { status: 400 }
      );
    }

    // Generate 2FA setup data
    const setup = await TwoFactorService.generateSecret(
      user.email,
      "BS Market"
    );

    // Store the secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: setup.secret,
        twoFactorBackupCodes: setup.backupCodes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
        secret: setup.secret, // For manual entry in authenticator apps
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to set up 2FA",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

