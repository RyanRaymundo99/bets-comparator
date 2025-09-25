import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const result = await VerificationService.sendPhoneVerification(
      phone,
      "signup"
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        // In development, include the code for testing
        ...(process.env.NODE_ENV === "development" && { code: result.code }),
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Send phone verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
