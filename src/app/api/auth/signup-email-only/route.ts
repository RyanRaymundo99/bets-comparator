import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with email verification only
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerified: false, // Will be verified via email
        role: "CLIENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create temporary session for email verification
    const sessionId = `temp-session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await prisma.session.create({
      data: {
        id: sessionId,
        token: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      userId: user.id,
    });

    response.cookies.set("better-auth.session_token", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Email-only signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
