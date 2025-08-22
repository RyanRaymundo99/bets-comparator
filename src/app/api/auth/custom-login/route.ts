import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  console.log("Custom login endpoint called");
  try {
    const { email, password } = await request.json();
    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // First, try to find a user with the custom password field (dev users)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    let isValidPassword = false;

    // Check if this is a dev user with custom password
    if (user.password) {
      // This is a dev user with bcrypt password
      try {
        isValidPassword = await compare(password, user.password);
        console.log("Dev user password check:", { isValid: isValidPassword });
      } catch (error) {
        console.error("Error comparing bcrypt password:", error);
        isValidPassword = false;
      }
    } else {
      // This is a better-auth user, check Account table
      const account = user.accounts.find((acc) => acc.password);
      if (account?.password) {
        try {
          isValidPassword = await compare(password, account.password);
          console.log("Better-auth password check:", {
            isValid: isValidPassword,
          });
        } catch (error) {
          console.error("Error comparing better-auth password:", error);
          isValidPassword = false;
        }
      }
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (user.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Simple session management - just return user data
    // The frontend will handle storing it in localStorage
    console.log("Login successful for user:", user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        approvalStatus: user.approvalStatus,
        kycStatus: user.kycStatus,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Custom login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
