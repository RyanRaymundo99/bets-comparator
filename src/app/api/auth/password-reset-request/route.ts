import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";
import prisma from "@/lib/prisma";
import { SMSService } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { error: "Identifier and type are required" },
        { status: 400 }
      );
    }

    if (!["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'email' or 'phone'" },
        { status: 400 }
      );
    }

    // Format identifier based on type
    const formattedIdentifier =
      type === "phone"
        ? SMSService.formatPhoneNumber(identifier)
        : identifier.toLowerCase();

    // Check if user exists with this identifier
    const user = await prisma.user.findFirst({
      where:
        type === "email"
          ? { email: formattedIdentifier }
          : { phone: formattedIdentifier },
    });

    if (!user) {
      // For security, don't reveal whether the identifier exists
      return NextResponse.json({
        success: true,
        message: `If an account with this ${type} exists, a reset code has been sent.`,
      });
    }

    // Send password reset code
    const result = await VerificationService.sendPasswordResetCode(
      formattedIdentifier,
      type as "email" | "phone"
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


