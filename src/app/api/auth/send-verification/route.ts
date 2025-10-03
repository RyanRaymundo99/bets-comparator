import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const { identifier, type, purpose = "signup" } = await request.json();

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

    const result = await VerificationService.sendEmailVerification(
      identifier,
      purpose
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
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
