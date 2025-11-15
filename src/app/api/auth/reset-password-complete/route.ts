import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { identifier, code, newPassword } = await request.json();

    if (!identifier || !code || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Format identifier (email only)
    const formattedIdentifier = identifier.toLowerCase();

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: formattedIdentifier },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify that we still have a valid reset verification
    // This ensures the code was recently verified and prevents replay attacks
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: formattedIdentifier,
        type: "EMAIL",
        purpose: "password_reset",
        value: code,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new reset." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Delete the verification record to prevent reuse
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    // Delete any active sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Password reset completion error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}













