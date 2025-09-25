import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";
import { SMSService } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const { identifier, code, type } = await request.json();

    if (!identifier || !code || !type) {
      return NextResponse.json(
        { error: "Identifier, code, and type are required" },
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

    const result = await VerificationService.verifyCode(
      formattedIdentifier,
      code,
      type === "email" ? "EMAIL" : "PHONE",
      "password_reset"
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Reset code verified successfully",
      });
    } else {
      return NextResponse.json(
        {
          error: result.message,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Reset code verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify reset code" },
      { status: 500 }
    );
  }
}


