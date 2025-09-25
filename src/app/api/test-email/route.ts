import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("🧪 Testing email sending to:", email);

    const result = await sendEmail({
      to: email,
      subject: "BS Market - Test Email",
      text: "This is a test email from BS Market to verify email functionality is working correctly.\n\nIf you received this, your email configuration is working!",
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

