import { NextRequest, NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/two-factor";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and 2FA token are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA is not enabled for this account" },
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

    // Verify the token or backup code
    const verification = TwoFactorService.verifyTokenOrBackupCode(
      user.twoFactorSecret,
      token,
      user.twoFactorBackupCodes
    );

    if (!verification.isValid) {
      return NextResponse.json(
        { error: "Invalid 2FA token or backup code" },
        { status: 400 }
      );
    }

    // If a backup code was used, remove it from the list
    if (verification.usedBackupCode) {
      const updatedBackupCodes = TwoFactorService.removeUsedBackupCode(
        user.twoFactorBackupCodes,
        verification.usedBackupCode
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: updatedBackupCodes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "2FA verification successful",
      usedBackupCode: !!verification.usedBackupCode,
      remainingBackupCodes: verification.usedBackupCode
        ? user.twoFactorBackupCodes.length - 1
        : user.twoFactorBackupCodes.length,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify 2FA",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

