import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const { identifier, code, type } = await request.json();

    if (!identifier || !code || !type) {
      return NextResponse.json(
        { error: "Identifier, code, and type are required" },
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

    const result = await VerificationService.verifyCode(
      formattedIdentifier,
      code,
      "EMAIL",
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
