import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and code are required" },
        { status: 400 }
      );
    }

    const result = await VerificationService.verifyCode(
      phone,
      code,
      "PHONE",
      "signup"
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
    console.error("Verify phone error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
