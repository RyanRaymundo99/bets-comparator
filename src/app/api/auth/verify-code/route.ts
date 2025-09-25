import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const { identifier, code, type, purpose = "signup" } = await request.json();

    if (!identifier || !code || !type) {
      return NextResponse.json(
        { error: "Identifier, code, and type are required" },
        { status: 400 }
      );
    }

    if (!["EMAIL", "PHONE"].includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: "Type must be 'EMAIL' or 'PHONE'" },
        { status: 400 }
      );
    }

    const result = await VerificationService.verifyCode(
      identifier,
      code,
      type.toUpperCase() as "EMAIL" | "PHONE",
      purpose
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
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
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}


