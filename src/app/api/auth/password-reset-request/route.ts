import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { error: "Identifier and type are required" },
        { status: 400 }
      );
    }

    if (type !== "email") {
      return NextResponse.json(
        { error: "Type must be 'email'" },
        { status: 400 }
      );
    }

    // Format identifier
    const formattedIdentifier = identifier.toLowerCase();

    // Check if user exists with this email
    const user = await prisma.user.findFirst({
      where: { email: formattedIdentifier },
    });

    if (!user) {
      // For security, don't reveal whether the identifier exists
      return NextResponse.json({
        success: true,
        message: `If an account with this email exists, a reset code has been sent.`,
      });
    }

    // Send password reset code
    const result = await VerificationService.sendPasswordResetCode(
      formattedIdentifier
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        code: result.code, // Only included in development
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
